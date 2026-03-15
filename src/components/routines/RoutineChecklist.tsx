import { useState, useEffect } from 'react'
import { X, PartyPopper } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useRoutineStore } from '../../store/routine-store'
import { useStickerStore } from '../../store/sticker-store'
import { showToast } from '../../store/toast-store'
import { format } from 'date-fns'
import type { Routine } from '../../store/routine-store'

interface Props {
  routine: Routine
  memberId: string
  onClose: () => void
}

export default function RoutineChecklist({ routine, memberId, onClose }: Props) {
  const completeStep = useRoutineStore((s) => s.completeStep)
  const getProgress = useRoutineStore((s) => s.getProgress)
  const today = format(new Date(), 'yyyy-MM-dd')
  const progress = getProgress(routine.id, memberId, today)

  const completedSteps = new Set(progress?.completedSteps ?? [])
  const completedCount = completedSteps.size
  const totalSteps = routine.steps.length
  const allDone = completedCount === totalSteps
  const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  // Morning countdown state
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null)

  useEffect(() => {
    if (routine.type !== 'morning') return

    function calcMinutes() {
      const [h, m] = routine.triggerTime.split(':').map(Number)
      const now = new Date()
      const deadline = new Date()
      deadline.setHours(h + 2, m, 0, 0) // 2 hours after trigger time
      const diff = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 60000))
      setMinutesLeft(diff)
    }

    calcMinutes()
    const interval = setInterval(calcMinutes, 30000)
    return () => clearInterval(interval)
  }, [routine.type, routine.triggerTime])

  const handleToggleStep = (stepId: string) => {
    if (completedSteps.has(stepId)) return // Already done, no undo
    completeStep(routine.id, memberId, stepId)

    // Check if this completes the routine (completed + this one = total)
    if (completedCount + 1 === totalSteps) {
      // Award bonus sticker
      const sticker = useStickerStore.getState().awardRandomSticker(memberId)
      if (sticker) {
        showToast(`Bonus sticker: ${sticker.emoji} ${sticker.name}!`, 'success')
      }
    }
  }

  const routineTitle = routine.type === 'bedtime' ? 'Bedtime Routine' : 'Morning Routine'
  const routineEmoji = routine.type === 'bedtime' ? '\u{1F319}' : '\u{2600}\uFE0F'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-[90%] max-w-sm mx-auto overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{routineEmoji}</span>
            <h2 className="text-lg font-extrabold text-foreground">{routineTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{completedCount}/{totalSteps} steps done</span>
            {routine.type === 'morning' && minutesLeft !== null && !allDone && (
              <span className={cn(
                'font-bold',
                minutesLeft <= 15 ? 'text-destructive' : minutesLeft <= 30 ? 'text-amber-500' : 'text-muted-foreground'
              )}>
                {minutesLeft > 0 ? `${minutesLeft} minutes left!` : 'Time is up!'}
              </span>
            )}
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                allDone ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="px-5 pb-4 space-y-2">
          {routine.steps.map((step) => {
            const isDone = completedSteps.has(step.id)
            return (
              <button
                key={step.id}
                onClick={() => handleToggleStep(step.id)}
                disabled={isDone}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                  isDone
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-muted hover:bg-accent active:scale-[0.98]'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  isDone
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-border'
                )}>
                  {isDone && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xl">{step.emoji}</span>
                <span className={cn(
                  'text-sm font-semibold',
                  isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                )}>
                  {step.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Celebration */}
        {allDone && (
          <div className="px-5 pb-5">
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 text-center">
              <PartyPopper className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-base font-extrabold text-foreground">All done! Amazing job!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {routine.type === 'bedtime' ? 'Sweet dreams tonight!' : 'Ready for a great day!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
