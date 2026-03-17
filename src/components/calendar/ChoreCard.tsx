import { Check, AlertCircle, Clock } from 'lucide-react'
import { isBefore, parseISO, startOfDay } from 'date-fns'
import type { ChoreOccurrence } from '../../types'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { useChoreStore } from '../../store/chore-store'
import { useAppStore } from '../../store/app-store'
import { fireConfetti } from '../../lib/confetti'

interface ChoreCardProps {
  occurrence: ChoreOccurrence
  onClick: () => void
  compact?: boolean
}

export default function ChoreCard({ occurrence, onClick, compact = true }: ChoreCardProps) {
  const members = useMemberStore((s) => s.members)
  const toggleCompletion = useChoreStore((s) => s.toggleCompletion)
  const submitForApproval = useChoreStore((s) => s.submitForApproval)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const member = members.find((m) => m.id === occurrence.chore.assigneeId)
  const color = member ? getMemberColor(member) : null
  const isOverdue = !occurrence.isCompleted && !occurrence.isPending && isBefore(startOfDay(parseISO(occurrence.date)), startOfDay(new Date()))

  // Show checkbox only if: no active kid selected (parent mode), or active kid matches assignee
  const canMarkDone = !activeKidId || activeKidId === occurrence.chore.assigneeId
  const isKidMode = !!activeKidId

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (occurrence.isPending) return // already pending
    if (occurrence.isCompleted) {
      // Undo — only parents (no active kid) can undo
      if (!isKidMode) {
        toggleCompletion(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
      }
      return
    }
    if (isKidMode) {
      // Kid mode: submit for approval
      submitForApproval(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
    } else {
      // Parent mode: mark done directly
      fireConfetti()
      toggleCompletion(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
    }
  }

  const isDark = document.documentElement.classList.contains('dark')

  let cardClasses: string
  let statusTextStyle: React.CSSProperties | undefined
  if (occurrence.isCompleted) {
    cardClasses = 'bg-emerald-100 border-l-4 border-l-emerald-600 border border-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700 dark:border-l-emerald-400'
    statusTextStyle = { color: isDark ? '#e5e5e5' : '#111111' }
  } else if (occurrence.isPending) {
    cardClasses = 'bg-amber-100 border-l-4 border-l-amber-500 border border-amber-300 dark:bg-amber-900/30 dark:border-amber-700 dark:border-l-amber-400'
    statusTextStyle = { color: isDark ? '#e5e5e5' : '#111111' }
  } else if (isOverdue) {
    cardClasses = 'bg-rose-100 border-l-4 border-l-rose-600 border border-rose-300 dark:bg-rose-900/30 dark:border-rose-700 dark:border-l-rose-400'
    statusTextStyle = { color: isDark ? '#e5e5e5' : '#111111' }
  } else if (color) {
    cardClasses = `bg-card border-l-4 ${color.accent} text-foreground border border-border/60 shadow-sm dark:shadow-none`
  } else {
    cardClasses = 'bg-card border-l-4 border-l-neutral-300 text-foreground border border-border/60 shadow-sm dark:shadow-none'
  }

  // ── Compact mode: small cards for desktop grid cells ──
  if (compact) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onClick() }}
        style={statusTextStyle}
        className={`flex items-center gap-1 xl:gap-1.5 rounded-lg px-1.5 xl:px-2 py-1.5 text-sm cursor-pointer transition-colors ${cardClasses} ${occurrence.isSkipped ? 'opacity-40 line-through' : ''}`}
      >
        {canMarkDone && !occurrence.isPending && (
          <button
            onClick={handleCheck}
            role="checkbox"
            aria-checked={occurrence.isCompleted}
            aria-label={`Mark ${occurrence.chore.name} as ${occurrence.isCompleted ? 'not done' : 'done'}`}
            className={`shrink-0 h-5 w-5 xl:h-4 xl:w-4 rounded-md border-2 flex items-center justify-center transition-colors ${
              occurrence.isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : isOverdue
                  ? 'border-rose-300 hover:border-rose-500 hover:bg-rose-50 dark:border-rose-400 dark:hover:border-rose-300 dark:hover:bg-rose-900/20'
                  : 'border-muted-foreground/50 hover:border-muted-foreground hover:bg-muted'
            }`}
          >
            {occurrence.isCompleted && <Check size={12} strokeWidth={3} />}
          </button>
        )}
        {occurrence.isPending && (
          <Clock size={14} className="shrink-0 text-amber-500" />
        )}
        {occurrence.chore.emoji && (
          <span className="shrink-0 text-sm xl:text-xs">{occurrence.chore.emoji}</span>
        )}
        {isOverdue && <AlertCircle size={12} className="shrink-0 text-rose-500 dark:text-rose-400" />}
        <span className={`truncate font-bold ${occurrence.isCompleted ? 'line-through' : ''}`}>
          {occurrence.chore.startTime && (
            <span className={`font-semibold ${(isOverdue || occurrence.isCompleted || occurrence.isPending) ? '' : 'text-muted-foreground'} hidden xl:inline`}>{occurrence.chore.startTime} </span>
          )}
          {occurrence.chore.name}
        </span>
        {member?.avatar && (
          <img src={member.avatar} alt="" className="shrink-0 h-6 w-6 rounded-full object-cover ml-auto hidden xl:block ring-2 ring-white dark:ring-neutral-800 shadow-sm bg-white dark:bg-neutral-700" />
        )}
      </div>
    )
  }

  // ── Full mode: large touch-friendly cards for mobile list ──
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={statusTextStyle}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[48px] text-sm cursor-pointer transition-colors ${cardClasses} ${occurrence.isSkipped ? 'opacity-40 line-through' : ''}`}
    >
      {canMarkDone && !occurrence.isPending && (
        <button
          onClick={handleCheck}
          role="checkbox"
          aria-checked={occurrence.isCompleted}
          aria-label={`Mark ${occurrence.chore.name} as ${occurrence.isCompleted ? 'not done' : 'done'}`}
          className={`shrink-0 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
            occurrence.isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : isOverdue
                ? 'border-rose-300 hover:border-rose-500 hover:bg-rose-50 dark:border-rose-400 dark:hover:border-rose-300 dark:hover:bg-rose-900/20'
                : 'border-muted-foreground/50 hover:border-muted-foreground hover:bg-muted'
          }`}
        >
          {occurrence.isCompleted && <Check size={16} strokeWidth={3} />}
        </button>
      )}
      {occurrence.isPending && (
        <div className="shrink-0 h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <Clock size={16} className="text-amber-500" />
        </div>
      )}
      {occurrence.chore.emoji && (
        <span className="shrink-0 text-lg">{occurrence.chore.emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <span className={`block text-sm font-bold truncate ${occurrence.isCompleted ? 'line-through' : ''}`}>
          {occurrence.chore.name}
        </span>
        <span className="block text-xs font-semibold">
          {member?.name ?? 'Unassigned'}
          {occurrence.chore.startTime && ` · ${occurrence.chore.startTime}`}
          {occurrence.isPending && ' · Waiting for approval'}
          {isOverdue && ' · Overdue'}
        </span>
      </div>
      {isOverdue && <AlertCircle size={16} className="shrink-0 text-rose-500 dark:text-rose-400" />}
      {member?.avatar ? (
        <img src={member.avatar} alt="" className="shrink-0 h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-neutral-800 shadow-sm bg-white dark:bg-neutral-700" />
      ) : member ? (
        <span className={`shrink-0 h-8 w-8 rounded-full ${color?.dot ?? 'bg-muted-foreground'} text-white text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-neutral-800 shadow-sm`}>
          {member.name.charAt(0).toUpperCase()}
        </span>
      ) : null}
    </div>
  )
}
