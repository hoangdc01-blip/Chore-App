import { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTopic } from '@/lib/language-data'
import { speak } from '@/lib/tts'
import { playCorrect, playWrong } from '@/games/sounds'
import { useLanguageStore } from '@/store/language-store'

interface Props {
  onComplete: () => void
  onQuit: () => void
}

export function LessonView({ onComplete, onQuit }: Props) {
  const { quizState, answerQuestion, advanceQuestion } = useLanguageStore()

  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [answeredWord, setAnsweredWord] = useState<{ word: string; romanization: string } | null>(null)

  const currentQ = quizState?.questions[quizState.currentIndex] ?? null
  const topicData = quizState ? getTopic(quizState.topicId) : null
  const total = quizState?.questions.length ?? 0
  const currentIndex = quizState?.currentIndex ?? 0
  const progressPct = total > 0 ? Math.round(((currentIndex) / total) * 100) : 0

  // Derive display data from the topic words using wordIndex
  const currentWord = (currentQ && topicData)
    ? topicData.topic.words[currentQ.wordIndex]
    : null
  const correctOptionIndex = currentQ
    ? currentQ.options.indexOf(currentQ.correctAnswer)
    : -1

  // Language code for TTS
  const langMap: Record<string, string> = {
    ko: 'ko-KR',
    ja: 'ja-JP',
    zh: 'zh-CN',
    vi: 'vi-VN',
    en: 'en-US',
  }
  const lang = topicData ? langMap[topicData.language.code] ?? 'en-US' : 'en-US'

  // Track the wordIndex to detect question changes for auto-speak
  const prevWordIndexRef = useRef<number | null>(null)

  // Auto-speak for 'listen' type questions when the question first appears
  // Auto-speak word for 'listen' and 'meaning-to-word' questions
  useEffect(() => {
    if (!currentQ || !currentWord || currentQ.wordIndex === prevWordIndexRef.current) {
      if (currentQ) prevWordIndexRef.current = currentQ.wordIndex
      return
    }
    prevWordIndexRef.current = currentQ.wordIndex
    if (currentQ.type === 'listen' || currentQ.type === 'meaning-to-word') {
      speak(currentWord.word, lang)
    }
  }, [currentQ?.type, currentQ?.wordIndex, currentWord, lang])

  // Auto-advance after showing result
  useEffect(() => {
    if (!showResult) return

    const timer = setTimeout(() => {
      setSelectedOption(null)
      setShowResult(false)
      setIsCorrect(false)
      setAnsweredWord(null)

      // Advance to next question (or complete)
      advanceQuestion()

      // Check if quiz is now complete after advancing
      const state = useLanguageStore.getState().quizState
      if (state?.isComplete) {
        onComplete()
      }
    }, 1800)

    return () => clearTimeout(timer)
  }, [showResult, advanceQuestion, onComplete])

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (showResult || selectedOption !== null) return

      setSelectedOption(optionIndex)
      const correct = optionIndex === correctOptionIndex
      setIsCorrect(correct)
      setShowResult(true)

      // Capture the word BEFORE answerQuestion advances the index
      const wordToSpeak = currentWord ? { word: currentWord.word, romanization: currentWord.romanization } : null
      setAnsweredWord(wordToSpeak)

      // Play sound effect
      if (correct) {
        playCorrect()
      } else {
        playWrong()
      }

      // Update store
      answerQuestion(optionIndex)

      // Speak the correct word after answering so kids learn the pronunciation
      if (wordToSpeak) {
        setTimeout(() => speak(wordToSpeak.word, lang), 400)
      }
    },
    [showResult, selectedOption, correctOptionIndex, answerQuestion, currentWord, lang],
  )

  const handleSpeak = useCallback(() => {
    const wordToSpeak = answeredWord?.word || currentWord?.word
    if (!wordToSpeak) return
    speak(wordToSpeak, lang)
  }, [currentWord, answeredWord, lang])

  const handleSpeakOption = useCallback(
    (optionText: string, e: React.MouseEvent) => {
      e.stopPropagation()
      speak(optionText, lang)
    },
    [lang],
  )

  if (!quizState || !currentQ) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading lesson...</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'mx-auto max-w-lg space-y-6 rounded-3xl p-6 transition-colors duration-300',
        showResult && isCorrect && 'bg-green-50 dark:bg-green-900/20',
        showResult && !isCorrect && 'bg-red-50 dark:bg-red-900/20',
      )}
    >
      {/* Header with quit + progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onQuit}
            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Quit lesson"
          >
            <X size={18} />
            Quit
          </button>
          <span className="text-sm font-semibold text-muted-foreground">
            {currentIndex + 1} / {total}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{progressPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question prompt */}
      <div className="space-y-4 text-center">
        {currentQ.type === 'word-to-meaning' && (
          <>
            <p className="text-base font-medium text-muted-foreground">
              What does this mean?
            </p>
            <button
              onClick={handleSpeak}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors mx-auto"
            >
              <Volume2 size={22} className="text-primary shrink-0" />
              <span className="text-4xl font-bold text-foreground">{currentWord?.word}</span>
            </button>
            <p className="text-lg text-muted-foreground">
              ({currentWord?.romanization})
            </p>
          </>
        )}

        {currentQ.type === 'meaning-to-word' && (
          <>
            <p className="text-base font-medium text-muted-foreground">
              How do you say this?
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl">{currentWord?.emoji}</span>
              <p className="text-3xl font-bold text-foreground">
                {currentWord?.meaning}
              </p>
            </div>
            <button
              onClick={handleSpeak}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors mx-auto"
            >
              <Volume2 size={18} className="text-primary shrink-0" />
              <span className="text-lg font-bold text-primary">{currentWord?.word}</span>
              <span className="text-sm text-muted-foreground">({currentWord?.romanization})</span>
            </button>
          </>
        )}

        {currentQ.type === 'listen' && (
          <>
            <p className="text-base font-medium text-muted-foreground">
              What did you hear?
            </p>
            <button
              onClick={handleSpeak}
              className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-transform hover:scale-105 active:scale-95 mx-auto shadow-sm"
            >
              <Volume2 size={28} className="text-primary shrink-0" />
              <span className="text-3xl font-bold text-foreground">{currentWord?.word}</span>
              <span className="text-lg text-muted-foreground">({currentWord?.romanization})</span>
            </button>
            <p className="text-sm text-muted-foreground">
              Tap to listen again
            </p>
          </>
        )}
      </div>

      {/* 2x2 option grid */}
      <div className="grid grid-cols-2 gap-3">
        {currentQ.options.map((option, i) => {
          const isSelected = selectedOption === i
          const isCorrectAnswer = i === correctOptionIndex

          let optionStyle = 'border-border bg-card hover:border-primary hover:bg-primary/5'

          if (showResult) {
            if (isCorrectAnswer) {
              optionStyle =
                'border-green-500 bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-100 ring-2 ring-green-400'
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle =
                'border-red-500 bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100 ring-2 ring-red-400'
            } else {
              optionStyle = 'border-border bg-card opacity-50'
            }
          }

          // For meaning-to-word, options are foreign words -- show speak icon
          const isForeignWordOption = currentQ.type === 'meaning-to-word'

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={showResult}
              className={cn(
                'relative rounded-2xl border-2 p-4 text-center text-lg font-semibold transition-all',
                'active:scale-95',
                optionStyle,
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {option}
                {isForeignWordOption && (
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(e) => handleSpeakOption(option, e)}
                    className="inline-flex items-center justify-center p-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                    aria-label={`Listen to ${option}`}
                  >
                    <Volume2 size={14} />
                  </span>
                )}
              </span>
              {showResult && isCorrectAnswer && (
                <span className="absolute -top-2 -right-2 text-2xl">
                  {isSelected ? '🎉' : '👈'}
                </span>
              )}
              {showResult && isSelected && !isCorrectAnswer && (
                <span className="absolute -top-2 -right-2 text-2xl">
                  ❌
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className="space-y-2 text-center">
          {isCorrect ? (
            <p className="text-xl font-bold text-green-600">
              Correct! Great job! 🌟
            </p>
          ) : (
            <p className="text-xl font-bold text-red-600">
              Not quite! Keep trying! 💪
            </p>
          )}
          {currentWord && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold">{currentWord.word}</span>
              <span className="text-sm text-muted-foreground">({currentWord.romanization})</span>
              <button
                onClick={handleSpeak}
                className="p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                aria-label="Listen to pronunciation"
              >
                <Volume2 size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
