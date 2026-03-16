import { useState, useEffect, useCallback } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTopic } from '@/lib/language-data'
import { speak } from '@/lib/tts'
import { useLanguageStore } from '@/store/language-store'

interface Props {
  onComplete: () => void
}

export function LessonView({ onComplete }: Props) {
  const { quizState, answerQuestion } = useLanguageStore()

  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

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

  // Auto-advance after showing result
  useEffect(() => {
    if (!showResult) return

    const timer = setTimeout(() => {
      setSelectedOption(null)
      setShowResult(false)
      setIsCorrect(false)

      // Check if quiz is now complete
      if (quizState?.isComplete) {
        onComplete()
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [showResult, quizState?.isComplete, onComplete])

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (showResult || selectedOption !== null) return

      setSelectedOption(optionIndex)
      const correct = optionIndex === correctOptionIndex
      setIsCorrect(correct)
      setShowResult(true)

      // Update store
      answerQuestion(optionIndex)
    },
    [showResult, selectedOption, currentQ, answerQuestion],
  )

  const handleSpeak = useCallback(() => {
    if (!currentQ) return
    // Determine language code for TTS
    const langMap: Record<string, string> = {
      ko: 'ko-KR',
      ja: 'ja-JP',
      zh: 'zh-CN',
      vi: 'vi-VN',
      en: 'en-US',
    }
    const lang = topicData ? langMap[topicData.language.code] ?? 'en-US' : 'en-US'
    speak(currentWord?.word ?? '', lang)
  }, [currentQ, topicData])

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
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {total}
          </span>
          <span>{progressPct}%</span>
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
            <p className="text-5xl font-bold text-foreground">{currentWord?.word}</p>
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
          </>
        )}

        {currentQ.type === 'listen' && (
          <>
            <p className="text-base font-medium text-muted-foreground">
              What did you hear?
            </p>
            <button
              onClick={handleSpeak}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
            >
              <Volume2 className="h-10 w-10" />
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
              {option}
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
        <div className="text-center">
          {isCorrect ? (
            <p className="text-xl font-bold text-green-600">
              Correct! Great job! 🌟
            </p>
          ) : (
            <p className="text-xl font-bold text-red-600">
              Not quite! Keep trying! 💪
            </p>
          )}
        </div>
      )}
    </div>
  )
}
