import { X, Trash2, Check, Pencil, RotateCw, Clock } from 'lucide-react'
import type { ChoreOccurrence } from '../../types'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'

interface ChoreDetailsProps {
  occurrence: ChoreOccurrence | null
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const recurrenceLabels: Record<string, string> = {
  none: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
}

export default function ChoreDetails({ occurrence, open, onClose, onEdit }: ChoreDetailsProps) {
  const removeChore = useChoreStore((s) => s.removeChore)
  const toggleCompletion = useChoreStore((s) => s.toggleCompletion)
  const members = useMemberStore((s) => s.members)

  if (!open || !occurrence) return null

  const member = members.find((m) => m.id === occurrence.chore.assigneeId)
  const color = member ? getMemberColor(member) : null

  const handleDelete = () => {
    removeChore(occurrence.choreId)
    onClose()
  }

  const handleToggle = () => {
    toggleCompletion(occurrence.choreId, occurrence.date)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-lg border border-border w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Chore Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <p className={`text-lg font-medium ${occurrence.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {occurrence.chore.name}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Assigned to:</span>
            {member ? (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${color?.bg} ${color?.text}`}>
                <span className={`h-2 w-2 rounded-full ${color?.dot}`} />
                {member.name}
              </span>
            ) : (
              <span className="text-muted-foreground italic">Unassigned</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Date:</span>
            <span>{occurrence.date}</span>
          </div>

          {occurrence.chore.startTime && (
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-muted-foreground" />
              <span>{occurrence.chore.startTime}</span>
            </div>
          )}

          {occurrence.chore.recurrence !== 'none' && (
            <div className="flex items-center gap-2 text-sm">
              <RotateCw size={14} className="text-muted-foreground" />
              <span>{recurrenceLabels[occurrence.chore.recurrence]}</span>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-border">
            <button
              onClick={handleToggle}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                occurrence.isCompleted
                  ? 'border border-border hover:bg-muted'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Check size={16} />
              {occurrence.isCompleted ? 'Undo' : 'Mark Done'}
            </button>
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-1.5 rounded-md bg-destructive text-destructive-foreground px-3 py-2 text-sm font-medium hover:bg-destructive/90 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
