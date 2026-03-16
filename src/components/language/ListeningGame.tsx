import { useState, useCallback, useEffect } from 'react'
import { Volume2, X, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { speak } from '@/lib/tts'
import { playCorrect, playWrong } from '@/games/sounds'
import type { VocabWord } from '@/lib/language-data'

interface Props {
  words: VocabWord[]
  languageCode: string
  onQuit: () => void
  onComplete: (score: number, total: number) => void
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface ListenQuestion {
  word: VocabWord
  options: { emoji: string; meaning: string }[]
  correctIndex: number
}

function generateQuestions(words: VocabWord[]): ListenQuestion[] {
  const picked = shuffle(words).slice(0, Math.min(8, words.length))
  return picked.map(word => {
    const wrongWords = shuffle(words.filter(w => w.word !== word.word)).slice(0, 3)
    const options = shuffle([
      { emoji: word.emoji, meaning: word.meaning },
      ...wrongWords.map(w => ({ emoji: w.emoji, meaning: w.meaning }))
    ])
    const correctIndex = options.findIndex(o => o.meaning === word.meaning)
    return { word, options, correctIndex }
  })
}

function getTTSLang(code: string): string {
  switch (code) {
    case 'en': return 'en-US'
    case 'vi': return 'vi-VN'
    case 'ko': return 'ko-KR'
    case 'ja': return 'ja-JP'
    case 'zh': return 'zh-CN'
    default: return 'en-US'
  }
}

export default function ListeningGame({ words, languageCode, onQuit, onComplete }: Props) {
  const [questions] = useState(() => generateQuestions(words))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)

  const currentQ = questions[currentIndex] ?? null
  const total = questions.length
  const isComplete = currentIndex >= total
  const ttsLang = getTTSLang(languageCode)

  // Auto-play word when question appears
  useEffect(() => {
    if (currentQ && !showResult) {
      const timer = setTimeout(() => speak(currentQ.word.word, ttsLang), 300)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, showResult, currentQ, ttsLang])

  useEffect(() => {
    if (isComplete) onComplete(score, total)
  }, [isComplete, score, total, onComplete])

  const handlePlay = useCallback(() => {
    if (currentQ) speak(currentQ.word.word, ttsLang)
  }, [currentQ, ttsLang])

  const handleAnswer = useCallback((optionIndex: number) => {
    if (showResult || !currentQ) return
    setSelectedOption(optionIndex)
    setShowResult(true)

    const correct = optionIndex === currentQ.correctIndex
    if (correct) {
      setScore(prev => prev + 1)
      playCorrect()
    } else {
      playWrong()
    }

    // Speak the correct word after answering
    setTimeout(() => speak(currentQ.word.word, ttsLang), 400)

    // Auto-advance
    setTimeout(() => {
      setSelectedOption(null)
      setShowResult(false)
      setCurrentIndex(prev => prev + 1)
    }, 2000)
  }, [showResult, currentQ, ttsLang])

  if (isComplete) {
    const percentage = Math.round((score / total) * 100)
    const stars = percentage >= 100 ? 5 : percentage >= 80 ? 4 : percentage >= 60 ? 3 : percentage >= 40 ? 2 : 1
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-foreground">Great Listening!</h2>
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={32} className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted'} />
          ))}
        </div>
        <p className="text-xl font-bold">{score} / {total} correct</p>
        <button onClick={onQuit} className="px-6 py-3 rounded-full bg-muted text-foreground font-bold">Done</button>
      </div>
    )
  }

  if (!currentQ) return null

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onQuit} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
          <X size={18} />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">{currentIndex + 1} / {total}</span>
        <div className="flex items-center gap-1 text-amber-500">
          <Star size={16} fill="currentColor" />
          <span className="text-sm font-bold">{score}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(currentIndex / total) * 100}%` }} />
      </div>

      {/* Listen prompt */}
      <div className="text-center space-y-4 py-4">
        <p className="text-base font-medium text-muted-foreground">What did you hear?</p>
        <button
          onClick={handlePlay}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <Volume2 size={40} />
        </button>
        <p className="text-sm text-muted-foreground">Tap to listen again</p>
      </div>

      {/* Options - show emoji + meaning */}
      <div className="grid grid-cols-2 gap-3">
        {currentQ.options.map((option, i) => {
          const isSelected = selectedOption === i
          const isCorrectAnswer = i === currentQ.correctIndex

          let optionStyle = 'border-border bg-card hover:border-primary hover:bg-primary/5'
          if (showResult) {
            if (isCorrectAnswer) {
              optionStyle = 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-400'
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle = 'border-rose-500 bg-rose-100 dark:bg-rose-900/40 ring-2 ring-rose-400'
            } else {
              optionStyle = 'border-border bg-card opacity-50'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={showResult}
              className={cn(
                'rounded-2xl border-2 p-4 text-center transition-all active:scale-95',
                optionStyle
              )}
            >
              <span className="text-3xl block mb-1">{option.emoji}</span>
              <span className="text-sm font-semibold text-foreground">{option.meaning}</span>
            </button>
          )
        })}
      </div>

      {/* Show correct word after answering */}
      {showResult && (
        <div className="text-center space-y-1">
          <p className="text-sm text-muted-foreground">The word was:</p>
          <p className="text-2xl font-bold text-foreground">{currentQ.word.word}</p>
          <p className="text-sm text-muted-foreground">({currentQ.word.romanization})</p>
        </div>
      )}
    </div>
  )
}
