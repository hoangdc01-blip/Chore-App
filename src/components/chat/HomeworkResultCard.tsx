import type { HomeworkCheckResult } from '../../types'

interface Props {
  result: HomeworkCheckResult
  onDismiss: () => void
}

const SUBJECT_LABELS: Record<string, string> = {
  math: 'Math',
  reading: 'Reading',
  writing: 'Writing',
  science: 'Science',
  vietnamese: 'Vietnamese',
  chinese: 'Chinese',
}

export default function HomeworkResultCard({ result, onDismiss }: Props) {
  const isPerfect = result.errors.length === 0

  return (
    <div className="bg-card border border-border rounded-xl p-3 mb-3 ml-10 animate-fade-in-up">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
        Homework Check
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{isPerfect ? '\u{1F4AF}' : '\u{1F4DD}'}</span>
        <span className="font-bold text-foreground">
          {SUBJECT_LABELS[result.subject] ?? result.subject}
        </span>
      </div>

      <div className="text-sm font-bold mb-2">
        {isPerfect
          ? `Perfect score! ${result.correct}/${result.totalProblems} correct! \u{1F389}`
          : `\u2705 ${result.correct}/${result.totalProblems} correct!`}
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-2 mb-3">
          {result.errors.map((err, i) => (
            <div
              key={i}
              className="bg-destructive/5 border border-destructive/20 rounded-lg p-2 text-xs"
            >
              <div className="font-bold text-foreground mb-0.5">
                {'\u274C'} {err.problem} — your answer: {err.kidAnswer}
              </div>
              <div className="text-muted-foreground">
                {'\u{1F4A1}'} Hint: {err.hint}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onDismiss}
        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white py-2 text-sm font-bold transition-colors"
      >
        Got it!
      </button>
    </div>
  )
}
