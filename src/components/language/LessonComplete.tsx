import { Star, RotateCcw, ArrowLeft, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionResult {
  word: string
  correctAnswer: string
  wasCorrect: boolean
}

interface LessonResults {
  total: number
  correct: number
  pointsEarned: number
  questions: QuestionResult[]
}

interface Props {
  results: LessonResults
  onPracticeAgain: () => void
  onBackToTopics: () => void
}

function getHeadline(correct: number, total: number) {
  const ratio = total > 0 ? correct / total : 0
  if (ratio >= 1) return { text: 'Perfect! Amazing!', emoji: '🏆' }
  if (ratio >= 0.8) return { text: 'Amazing!', emoji: '🌟' }
  if (ratio >= 0.6) return { text: 'Great job!', emoji: '🎉' }
  if (ratio >= 0.4) return { text: 'Good try!', emoji: '💪' }
  return { text: 'Keep practicing!', emoji: '📚' }
}

export function LessonComplete({
  results,
  onPracticeAgain,
  onBackToTopics,
}: Props) {
  const { total, correct, pointsEarned, questions } = results
  const headline = getHeadline(correct, total)

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4">
      {/* Celebration header */}
      <div className="space-y-2 text-center">
        <span className="text-6xl">{headline.emoji}</span>
        <h1 className="text-3xl font-extrabold text-foreground">
          {headline.text}
        </h1>
      </div>

      {/* Score + stars */}
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-xl font-bold text-foreground">
          {correct} / {total} correct
        </p>

        {/* Star rating */}
        <div className="mt-3 flex items-center justify-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'h-8 w-8 transition-all',
                i < correct
                  ? 'fill-yellow-400 text-yellow-400 scale-110'
                  : 'fill-muted text-muted',
              )}
            />
          ))}
        </div>

        {/* Points earned */}
        <p className="mt-4 text-2xl font-extrabold text-primary">
          +{pointsEarned} points!
        </p>
      </div>

      {/* Question breakdown */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-foreground">Your Answers</h3>
        <div className="space-y-2">
          {questions.map((q, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                q.wasCorrect
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50',
              )}
            >
              {/* Check / X icon */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  q.wasCorrect
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white',
                )}
              >
                {q.wasCorrect ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <X className="h-5 w-5" />
                )}
              </div>

              {/* Word + correct answer */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-foreground">
                  {q.word}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {q.correctAnswer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBackToTopics}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border bg-card px-4 py-3 text-base font-bold text-foreground shadow-sm transition-transform hover:bg-muted active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Topics
        </button>
        <button
          onClick={onPracticeAgain}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground shadow transition-transform hover:scale-105 active:scale-95"
        >
          <RotateCcw className="h-5 w-5" />
          Practice Again
        </button>
      </div>
    </div>
  )
}
