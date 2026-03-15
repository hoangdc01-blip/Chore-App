import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore } from '../../store/member-store'
import { showToast } from '../../store/toast-store'
import type { Chore, RecurrenceType } from '../../types'
import { DAY_LABELS } from '../../types'
import EmojiPicker from '../ui/EmojiPicker'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import { cn } from '../../lib/utils'
import { useFocusTrap } from '../../hooks/useFocusTrap'

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
  const trapRef = useFocusTrap<HTMLDivElement>(open)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none')
  const [customDays, setCustomDays] = useState<number[]>([])
  const [pointsStr, setPointsStr] = useState('')
  const [emoji, setEmoji] = useState('')

  useEffect(() => {
    if (editChore) {
      setName(editChore.name)
      setDescription(editChore.description ?? '')
      setAssigneeId(editChore.assigneeId)
      setStartDate(editChore.startDate)
      setStartTime(editChore.startTime ?? '')
      setRecurrence(editChore.recurrence)
      setCustomDays(editChore.customDays ?? [])
      setPointsStr(String(editChore.points ?? 1))
      setEmoji(editChore.emoji ?? '')
    } else {
      setName('')
      setDescription('')
      setAssigneeId(members[0]?.id ?? '')
      setStartDate(defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
      setStartTime(defaultTime ?? '')
      setRecurrence('none')
      setCustomDays([])
      setPointsStr('')
      setEmoji('')
    }
  }, [editChore, defaultDate, defaultTime, open, members])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const timeRequired = !!defaultTime && !editChore

  if (!open) return null

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !assigneeId) return
    if (timeRequired && !startTime) return
    if (recurrence === 'custom' && customDays.length === 0) return

    const choreData = {
      name: name.trim(),
      description: description.trim() || undefined,
      emoji: emoji || undefined,
      assigneeId,
      startDate,
      startTime: startTime || undefined,
      recurrence,
      customDays: recurrence === 'custom' ? customDays : undefined,
      points: Math.max(1, parseInt(pointsStr) || 1),
    }
    if (editChore) {
      updateChore(editChore.id, choreData)
      showToast('Chore updated!', 'success')
    } else {
      addChore(choreData)
      showToast('Chore added!', 'success')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chore-dialog-title"
        className="bg-background rounded-lg shadow-lg border border-border w-full max-w-[95vw] xl:max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 id="chore-dialog-title" className="font-semibold">{editChore ? 'Edit Chore' : 'Add Chore'}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Chore Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Do the dishes"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Icon <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <EmojiPicker value={emoji} onChange={setEmoji} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or details..."
              rows={2}
              className={cn(
                'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none',
              )}
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add kids first</p>
              ) : (
                <Select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points</label>
              <Input
                type="text"
                inputMode="numeric"
                value={pointsStr}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '' || /^[1-9]\d*$/.test(v)) setPointsStr(v)
                }}
                onBlur={() => { if (!pointsStr || parseInt(pointsStr) < 1) setPointsStr('1') }}
                placeholder="Enter points"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Time {!timeRequired && <span className="text-muted-foreground font-normal">(optional)</span>}
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required={timeRequired}
                className={cn(
                  timeRequired && !startTime ? 'border-destructive' : '',
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Recurrence</label>
            <Select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom days</option>
            </Select>
          </div>

          {recurrence === 'custom' && (
            <div>
              <label className="block text-sm font-medium mb-2">Select Days</label>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`h-9 w-9 rounded-full text-xs font-medium transition-colors ${
                      customDays.includes(i)
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-muted'
                    }`}
                  >
                    {label.charAt(0)}
                  </button>
                ))}
              </div>
              {customDays.length === 0 && (
                <p className="text-xs text-destructive mt-1">Select at least one day</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !assigneeId || !pointsStr || (timeRequired && !startTime) || (recurrence === 'custom' && customDays.length === 0)}
            >
              {editChore ? 'Save' : 'Add Chore'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
