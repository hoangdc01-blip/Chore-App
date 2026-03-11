import { Check, AlertCircle } from 'lucide-react'
import { isBefore, parseISO, startOfDay } from 'date-fns'
import type { ChoreOccurrence } from '../../types'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { useChoreStore } from '../../store/chore-store'

interface ChoreCardProps {
  occurrence: ChoreOccurrence
  onClick: () => void
}

export default function ChoreCard({ occurrence, onClick }: ChoreCardProps) {
  const members = useMemberStore((s) => s.members)
  const toggleCompletion = useChoreStore((s) => s.toggleCompletion)
  const member = members.find((m) => m.id === occurrence.chore.assigneeId)
  const color = member ? getMemberColor(member) : null
  const isOverdue = !occurrence.isCompleted && isBefore(startOfDay(parseISO(occurrence.date)), startOfDay(new Date()))

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleCompletion(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
  }

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1 sm:gap-1 rounded px-1 sm:px-1.5 py-0.5 text-[11px] sm:text-xs cursor-pointer transition-colors ${
        isOverdue
          ? 'bg-red-50 text-red-700 border border-red-300'
          : color ? `${color.bg} ${color.text}` : 'bg-gray-100 text-gray-600'
      } ${occurrence.isCompleted ? 'opacity-60' : ''} ${occurrence.isSkipped ? 'opacity-40 line-through' : ''}`}
    >
      <button
        onClick={handleCheck}
        className={`shrink-0 h-4 w-4 sm:h-3.5 sm:w-3.5 rounded-sm border flex items-center justify-center ${
          occurrence.isCompleted
            ? 'bg-current border-current text-white'
            : 'border-current/40 hover:border-current'
        }`}
      >
        {occurrence.isCompleted && <Check size={10} strokeWidth={3} />}
      </button>
      {isOverdue && <AlertCircle size={10} className="shrink-0" />}
      {occurrence.chore.startTime && (
        <span className="shrink-0 opacity-70 hidden sm:inline">{occurrence.chore.startTime}</span>
      )}
      <span className={`truncate ${occurrence.isCompleted ? 'line-through' : ''}`}>
        {occurrence.chore.name}
      </span>
    </div>
  )
}
