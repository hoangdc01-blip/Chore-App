import { useState, useEffect } from 'react'
import { X, Trash2, Check, Pencil, RotateCw, Clock, SkipForward, Star, Undo2 } from 'lucide-react'
import type { ChoreOccurrence } from '../../types'
import { DAY_LABELS } from '../../types'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { useAppStore } from '../../store/app-store'
import { fireConfetti } from '../../lib/confetti'

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
  custom: 'Custom days',
}

export default function ChoreDetails({ occurrence, open, onClose, onEdit }: ChoreDetailsProps) {
  const removeChore = useChoreStore((s) => s.removeChore)
  const toggleCompletion = useChoreStore((s) => s.toggleCompletion)
  const submitForApproval = useChoreStore((s) => s.submitForApproval)
  const cancelPending = useChoreStore((s) => s.cancelPending)
  const toggleSkip = useChoreStore((s) => s.toggleSkip)
  const members = useMemberStore((s) => s.members)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const isKidMode = !!activeKidId
  const canMarkDone = !activeKidId || activeKidId === occurrence?.chore.assigneeId

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setConfirmDelete(false); setConfirmCancel(false); onClose() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !occurrence) return null

  const member = members.find((m) => m.id === occurrence.chore.assigneeId)
  const color = member ? getMemberColor(member) : null

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    removeChore(occurrence.choreId)
    setConfirmDelete(false)
    onClose()
  }

  const handleToggle = () => {
    if (occurrence.isPending) return // can't toggle while pending

    if (occurrence.isCompleted) {
      // Undo — only parents can undo
      if (!isKidMode) {
        toggleCompletion(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
      }
      onClose()
      return
    }

    if (isKidMode) {
      submitForApproval(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
    } else {
      fireConfetti()
      toggleCompletion(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); setConfirmCancel(false); onClose() }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div
        className="bg-background rounded-lg shadow-lg border border-border w-full max-w-[95vw] xl:max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Chore Details</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className={`text-lg font-medium ${occurrence.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {occurrence.chore.emoji && <span className="mr-1.5">{occurrence.chore.emoji}</span>}
              {occurrence.chore.name}
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-amber-600 font-medium">
              <Star size={14} fill="currentColor" />
              {occurrence.chore.points} pts
            </span>
          </div>

          {/* Pending badge */}
          {occurrence.isPending && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              <Clock size={16} />
              Waiting for parent approval
            </div>
          )}

          {occurrence.chore.description && (
            <p className="text-sm text-muted-foreground">{occurrence.chore.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Assigned to:</span>
            {member ? (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${color?.bg} ${color?.text}`}>
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <span className={`h-2 w-2 rounded-full ${color?.dot}`} />
                )}
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
              <span>
                {recurrenceLabels[occurrence.chore.recurrence]}
                {occurrence.chore.recurrence === 'custom' && occurrence.chore.customDays && (
                  <span className="ml-1 text-muted-foreground">
                    ({occurrence.chore.customDays.map((d) => DAY_LABELS[d]).join(', ')})
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-border flex-wrap">
            {/* Mark Done / Undo / Pending indicator + Cancel */}
            {occurrence.isPending ? (
              <>
                <div className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 min-h-[44px]">
                  <Clock size={16} />
                  Pending Approval
                </div>
                {isKidMode && activeKidId === occurrence.chore.assigneeId && (
                  <button
                    onClick={() => {
                      if (!confirmCancel) { setConfirmCancel(true); return }
                      cancelPending(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date)
                      setConfirmCancel(false)
                      onClose()
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                      confirmCancel
                        ? 'border-destructive text-destructive bg-destructive/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Undo2 size={16} />
                    {confirmCancel ? 'Are you sure?' : 'Cancel'}
                  </button>
                )}
              </>
            ) : canMarkDone ? (
              <button
                onClick={handleToggle}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  occurrence.isCompleted
                    ? 'border border-border hover:bg-muted'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Check size={16} />
                {occurrence.isCompleted ? 'Undo' : isKidMode ? 'Submit Done' : 'Mark Done'}
              </button>
            ) : null}

            {occurrence.chore.recurrence !== 'none' && !occurrence.isPending && (
              <button
                onClick={() => { toggleSkip(occurrence.choreId, occurrence.chore.assigneeId, occurrence.date); onClose() }}
                className={`flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  occurrence.isSkipped ? 'bg-muted text-muted-foreground' : 'hover:bg-muted'
                }`}
                title="Skip this single occurrence"
              >
                <SkipForward size={16} />
                {occurrence.isSkipped ? 'Unskip' : 'Skip'}
              </button>
            )}
            {!isKidMode && (
              <>
                <button
                  onClick={onEdit}
                  className="flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors min-h-[44px]"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                    confirmDelete
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse'
                      : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  }`}
                >
                  <Trash2 size={16} />
                  {confirmDelete && 'Confirm?'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
