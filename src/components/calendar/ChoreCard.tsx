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

  let cardClasses: string
  if (occurrence.isCompleted) {
    cardClasses = 'bg-green-100 border-l-4 border-l-green-600 text-green-900 border border-green-300 dark:bg-green-900/30 dark:text-green-100 dark:border-green-800 dark:border-l-green-500'
  } else if (occurrence.isPending) {
    cardClasses = 'bg-amber-50 border-l-4 border-l-amber-500 text-foreground border border-amber-300 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800 dark:border-l-amber-500'
  } else if (isOverdue) {
    cardClasses = 'bg-red-600 border-l-4 border-l-red-800 text-white border border-red-700 dark:bg-red-700 dark:text-white dark:border-red-800 dark:border-l-red-900'
  } else if (color) {
    cardClasses = `bg-card dark:bg-card border-l-4 ${color.accent} text-foreground border border-border shadow-sm dark:shadow-none`
  } else {
    cardClasses = 'bg-card dark:bg-card border-l-4 border-l-neutral-400 text-foreground border border-border shadow-sm dark:shadow-none'
  }

  // ── Compact mode: small cards for desktop grid cells ──
  if (compact) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onClick() }}
        className={`flex items-center gap-1 xl:gap-1.5 rounded-lg px-1.5 xl:px-2 py-1 text-xs xl:text-sm cursor-pointer transition-colors ${cardClasses} ${occurrence.isSkipped ? 'opacity-40 line-through' : ''}`}
      >
        {canMarkDone && !occurrence.isPending && (
          <button
            onClick={handleCheck}
            className={`shrink-0 h-5 w-5 xl:h-4 xl:w-4 rounded-md border-2 flex items-center justify-center transition-colors ${
              occurrence.isCompleted
                ? 'bg-green-600 border-green-600 text-white'
                : isOverdue
                  ? 'border-white/60 hover:border-white hover:bg-white/10'
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
        {isOverdue && <AlertCircle size={12} className="shrink-0 text-white" />}
        <span className={`truncate font-semibold ${occurrence.isCompleted ? 'line-through' : ''}`}>
          {occurrence.chore.startTime && (
            <span className={`font-normal ${isOverdue ? 'text-white/80' : 'text-muted-foreground'} hidden xl:inline`}>{occurrence.chore.startTime} </span>
          )}
          {occurrence.chore.name}
        </span>
        {member?.avatar && (
          <img src={member.avatar} alt="" className="shrink-0 h-4 w-4 rounded-full object-cover ml-auto hidden xl:block" />
        )}
      </div>
    )
  }

  // ── Full mode: large touch-friendly cards for mobile list ──
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[48px] text-sm cursor-pointer transition-colors ${cardClasses} ${occurrence.isSkipped ? 'opacity-40 line-through' : ''}`}
    >
      {canMarkDone && !occurrence.isPending && (
        <button
          onClick={handleCheck}
          className={`shrink-0 h-7 w-7 rounded-lg border-2 flex items-center justify-center transition-colors ${
            occurrence.isCompleted
              ? 'bg-green-600 border-green-600 text-white'
              : isOverdue
                ? 'border-white/60 hover:border-white hover:bg-white/10'
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
        <span className={`block text-sm font-semibold truncate ${occurrence.isCompleted ? 'line-through' : ''}`}>
          {occurrence.chore.name}
        </span>
        <span className={`block text-xs ${isOverdue ? 'text-white/80' : occurrence.isPending ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
          {member?.name ?? 'Unassigned'}
          {occurrence.chore.startTime && ` · ${occurrence.chore.startTime}`}
          {occurrence.isPending && ' · Waiting for approval'}
          {isOverdue && ' · Overdue'}
        </span>
      </div>
      {isOverdue && <AlertCircle size={16} className="shrink-0 text-white" />}
      {member?.avatar ? (
        <img src={member.avatar} alt="" className="shrink-0 h-7 w-7 rounded-full object-cover" />
      ) : member ? (
        <span className={`shrink-0 h-7 w-7 rounded-full ${color?.dot ?? 'bg-muted-foreground'} text-white text-xs font-bold flex items-center justify-center`}>
          {member.name.charAt(0).toUpperCase()}
        </span>
      ) : null}
    </div>
  )
}
