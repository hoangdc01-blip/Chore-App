import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore } from '../../store/member-store'
import type { Chore, RecurrenceType } from '../../types'

interface ChoreDialogProps {
  open: boolean
  onClose: () => void
  defaultDate?: string
  defaultTime?: string
  editChore?: Chore | null
}

export default function ChoreDialog({ open, onClose, defaultDate, defaultTime, editChore }: ChoreDialogProps) {
  const addChore = useChoreStore((s) => s.addChore)
  const updateChore = useChoreStore((s) => s.updateChore)
  const members = useMemberStore((s) => s.members)

  const [name, setName] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')

  useEffect(() => {
    if (editChore) {
      setName(editChore.name)
      setAssigneeId(editChore.assigneeId)
      setStartDate(editChore.startDate)
      setStartTime(editChore.startTime ?? '')
      setRecurrence(editChore.recurrence)
    } else {
      setName('')
      setAssigneeId(members[0]?.id ?? '')
      setStartDate(defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
      setStartTime(defaultTime ?? '')
      setRecurrence('none')
    }
  }, [editChore, defaultDate, defaultTime, open, members])

  const timeRequired = !!defaultTime && !editChore

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !assigneeId) return
    if (timeRequired && !startTime) return

    const choreData = {
      name: name.trim(),
      assigneeId,
      startDate,
      startTime: startTime || undefined,
      recurrence,
    }
    if (editChore) {
      updateChore(editChore.id, choreData)
    } else {
      addChore(choreData)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-lg border border-border w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">{editChore ? 'Edit Chore' : 'Add Chore'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Chore Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Clean kitchen"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assign To</label>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add team members first</p>
            ) : (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Time {!timeRequired && <span className="text-muted-foreground font-normal">(optional)</span>}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required={timeRequired}
                className={`w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring ${
                  timeRequired && !startTime ? 'border-destructive' : 'border-border'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recurrence</label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !assigneeId || (timeRequired && !startTime)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {editChore ? 'Save' : 'Add Chore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
