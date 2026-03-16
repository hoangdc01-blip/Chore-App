import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, Volume2, X, Star, RotateCcw } from 'lucide-react'
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

// Check if Speech Recognition is available
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[.,!?;:'"]/g, '')
}

export default function PronunciationGame({ words, languageCode, onQuit, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [result, setResult] = useState<'correct' | 'wrong' | 'listening' | null>(null)
  const [spokenText, setSpokenText] = useState('')
  const [score, setScore] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const recognitionRef = useRef<any>(null)

  const currentWord = words[currentIndex]
  const isComplete = currentIndex >= words.length
  const total = words.length

  // Language mapping for speech recognition
  const recognitionLang = languageCode === 'en' ? 'en-US'
    : languageCode === 'vi' ? 'vi-VN'
    : languageCode === 'ko' ? 'ko-KR'
    : languageCode === 'ja' ? 'ja-JP'
    : languageCode === 'zh' ? 'zh-CN'
    : 'en-US'

  // TTS language mapping
  const ttsLang = recognitionLang

  useEffect(() => {
    if (isComplete) {
      onComplete(score, total)
    }
  }, [isComplete, score, total, onComplete])

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  const handleListen = useCallback(() => {
    if (!SpeechRecognition) {
      setResult('wrong')
      setSpokenText('Speech recognition not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = recognitionLang
    recognition.interimResults = false
    recognition.maxAlternatives = 5
    recognition.continuous = false

    recognition.onstart = () => {
      setIsListening(true)
      setResult('listening')
      setSpokenText('')
      setShowHint(false)
    }

    recognition.onresult = (event: any) => {
      // Check all alternatives for a match
      const alternatives: string[] = []
      for (let i = 0; i < event.results[0].length; i++) {
        alternatives.push(event.results[0][i].transcript)
      }

      const targetWord = normalizeText(currentWord.word)
      const targetMeaning = normalizeText(currentWord.meaning)

      const isMatch = alternatives.some(alt => {
        const normalized = normalizeText(alt)
        return normalized === targetWord
          || normalized === targetMeaning
          || normalized.includes(targetWord)
          || targetWord.includes(normalized)
      })

      setSpokenText(alternatives[0] || '')

      if (isMatch) {
        setResult('correct')
        setScore(prev => prev + 1)
        playCorrect()
        // Auto-advance after 1.5s
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1)
          setResult(null)
          setSpokenText('')
          setAttempts(0)
          setShowHint(false)
        }, 1500)
      } else {
        setResult('wrong')
        setAttempts(prev => prev + 1)
        playWrong()
      }
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      if (event.error === 'no-speech') {
        setResult('wrong')
        setSpokenText("I didn't hear anything. Try again!")
      } else if (event.error === 'not-allowed') {
        setResult('wrong')
        setSpokenText('Please allow microphone access')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }, [isListening, recognitionLang, currentWord])

  const handlePlayWord = useCallback(() => {
    speak(currentWord.word, ttsLang)
  }, [currentWord, ttsLang])

  const handleSkip = useCallback(() => {
    setCurrentIndex(prev => prev + 1)
    setResult(null)
    setSpokenText('')
    setAttempts(0)
    setShowHint(false)
  }, [])

  const handleRetry = useCallback(() => {
    setResult(null)
    setSpokenText('')
  }, [])

  if (!SpeechRecognition) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-4">
        <p className="text-lg text-muted-foreground">Speech recognition is not supported in this browser.</p>
        <p className="text-sm text-muted-foreground">Please use Chrome or Edge for pronunciation practice.</p>
        <button onClick={onQuit} className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold">
          Go Back
        </button>
      </div>
    )
  }

  if (isComplete) {
    const percentage = Math.round((score / total) * 100)
    const stars = percentage >= 100 ? 5 : percentage >= 80 ? 4 : percentage >= 60 ? 3 : percentage >= 40 ? 2 : 1
    return (
      <div className="mx-auto max-w-lg p-6 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-foreground">Great Practice!</h2>
        <div className="flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={32} className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted'} />
          ))}
        </div>
        <p className="text-xl font-bold text-foreground">{score} / {total} correct</p>
        <p className="text-muted-foreground">{percentage}% accuracy</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onQuit} className="px-6 py-3 rounded-full bg-muted text-foreground font-bold">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onQuit} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <X size={18} />
        </button>
        <span className="text-sm font-semibold text-muted-foreground">
          {currentIndex + 1} / {total}
        </span>
        <div className="flex items-center gap-1 text-amber-500">
          <Star size={16} fill="currentColor" />
          <span className="text-sm font-bold">{score}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(currentIndex / total) * 100}%` }} />
      </div>

      {/* Word to pronounce */}
      <div className="text-center space-y-3 py-4">
        <p className="text-base font-medium text-muted-foreground">Say this word:</p>
        <span className="text-6xl block">{currentWord.emoji}</span>
        <button
          onClick={handlePlayWord}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary/10 hover:bg-primary/20 transition-colors mx-auto"
        >
          <Volume2 size={20} className="text-primary" />
          <span className="text-3xl font-bold text-foreground">{currentWord.word}</span>
        </button>
        <p className="text-lg text-muted-foreground">({currentWord.romanization})</p>

        {showHint && (
          <p className="text-sm text-muted-foreground italic">
            Meaning: {currentWord.meaning}
          </p>
        )}
      </div>

      {/* Microphone button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleListen}
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg',
            isListening
              ? 'bg-red-500 text-white animate-pulse scale-110'
              : result === 'correct'
                ? 'bg-emerald-500 text-white'
                : result === 'wrong'
                  ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-300'
                  : 'bg-primary text-primary-foreground hover:scale-105'
          )}
        >
          <Mic size={32} />
        </button>

        <p className="text-sm font-medium text-muted-foreground">
          {isListening ? 'Listening... speak now!'
            : result === 'correct' ? 'Perfect!'
            : result === 'wrong' ? 'Try again!'
            : 'Tap the mic and say the word'}
        </p>

        {/* What was heard */}
        {spokenText && result !== 'correct' && (
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">I heard:</p>
            <p className="text-lg font-semibold text-foreground">"{spokenText}"</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center gap-3">
        {result === 'wrong' && (
          <>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-muted text-foreground font-medium text-sm"
            >
              <RotateCcw size={14} />
              Try again
            </button>
            {attempts >= 2 && !showHint && (
              <button
                onClick={() => setShowHint(true)}
                className="px-4 py-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium text-sm"
              >
                Show hint
              </button>
            )}
            {attempts >= 3 && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 rounded-full bg-muted text-muted-foreground font-medium text-sm"
              >
                Skip
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
