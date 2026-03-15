import { useState, useMemo } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isToday, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Pencil, Trash2, X } from 'lucide-react'
import { useClassStore } from '../../store/class-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { getMonthDays } from '../../lib/calendar'
import type { ExtraClass, RecurrenceType } from '../../types'
import { cn } from '../../lib/utils'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom days' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ClassFormData {
  name: string
  emoji: string
  assigneeId: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  recurrence: RecurrenceType
  customDays: number[]
  location: string
  description: string
}

const emptyForm = (): ClassFormData => ({
  name: '',
  emoji: '',
  assigneeId: '',
  startDate: format(new Date(), 'yyyy-MM-dd'),
  endDate: '',
  startTime: '',
  endTime: '',
  recurrence: 'weekly',
  customDays: [],
  location: '',
  description: '',
})

export default function ClassCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClassFormData>(emptyForm())

  const { classes, addClass, removeClass, updateClass, getOccurrencesForRange } = useClassStore()
  const members = useMemberStore((s) => s.members)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = getMonthDays(currentDate)
  const occurrences = useMemo(
    () => getOccurrencesForRange(calendarStart, calendarEnd),
    [classes, calendarStart.getTime(), calendarEnd.getTime()]
  )

  const occByDate = useMemo(() => {
    const map: Record<string, typeof occurrences> = {}
    for (const occ of occurrences) {
      if (!map[occ.date]) map[occ.date] = []
      map[occ.date].push(occ)
    }
    return map
  }, [occurrences])

  const selectedDayStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedOccs = selectedDayStr ? (occByDate[selectedDayStr] ?? []) : []

  const openAdd = () => {
    setEditingId(null)
    const f = emptyForm()
    if (selectedDay) f.startDate = format(selectedDay, 'yyyy-MM-dd')
    if (members.length > 0) f.assigneeId = members[0].id
    setForm(f)
    setDialogOpen(true)
  }

  const openEdit = (cls: ExtraClass) => {
    setEditingId(cls.id)
    setForm({
      name: cls.name,
      emoji: cls.emoji ?? '',
      assigneeId: cls.assigneeId,
      startDate: cls.startDate,
      endDate: cls.endDate ?? '',
      startTime: cls.startTime ?? '',
      endTime: cls.endTime ?? '',
      recurrence: cls.recurrence,
      customDays: cls.customDays ?? [],
      location: cls.location ?? '',
      description: cls.description ?? '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.assigneeId) return
    const data = {
      name: form.name.trim(),
      emoji: form.emoji || undefined,
      assigneeId: form.assigneeId,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      recurrence: form.recurrence,
      customDays: form.recurrence === 'custom' ? form.customDays : undefined,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
    }
    if (editingId) {
      updateClass(editingId, data)
    } else {
      addClass(data)
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    removeClass(id)
    setDialogOpen(false)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-foreground min-w-[180px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Class
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto min-h-0 p-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayOccs = occByDate[dateStr] ?? []
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false
            const today = isToday(day)

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'min-h-[80px] p-1 rounded-lg border text-left transition-colors flex flex-col',
                  isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                  isSelected ? 'border-primary ring-1 ring-primary' : 'border-border/50',
                  'hover:border-primary/50'
                )}
              >
                <span className={cn(
                  'text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full',
                  today && 'bg-primary text-white',
                  !today && !isCurrentMonth && 'text-muted-foreground/50',
                  !today && isCurrentMonth && 'text-foreground'
                )}>
                  {format(day, 'd')}
                </span>
                {dayOccs.slice(0, 3).map((occ) => {
                  const member = members.find((m) => m.id === occ.classItem.assigneeId)
                  const color = member ? getMemberColor(member) : null
                  return (
                    <div
                      key={occ.classId + occ.date}
                      className={cn(
                        'text-[10px] leading-tight truncate rounded px-1 py-0.5 mb-0.5 font-medium',
                        color?.bg ?? 'bg-blue-100 dark:bg-blue-900/30',
                        color?.text ?? 'text-blue-700 dark:text-blue-300'
                      )}
                      title={`${occ.classItem.emoji ?? ''} ${occ.classItem.name}`}
                    >
                      {occ.classItem.emoji ? `${occ.classItem.emoji} ` : ''}{occ.classItem.name}
                    </div>
                  )
                })}
                {dayOccs.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{dayOccs.length - 3} more</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDay && (
        <div className="border-t border-border bg-card px-4 py-3 max-h-[35vh] overflow-auto shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-foreground text-sm">
              {format(selectedDay, 'EEEE, MMMM d')}
            </h3>
            <button onClick={() => setSelectedDay(null)} className="p-1 rounded hover:bg-muted" aria-label="Close detail panel">
              <X size={14} />
            </button>
          </div>
          {selectedOccs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No classes scheduled</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedOccs.map((occ) => {
                const member = members.find((m) => m.id === occ.classItem.assigneeId)
                const color = member ? getMemberColor(member) : null
                return (
                  <div
                    key={occ.classId + occ.date}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <span className="text-2xl">{occ.classItem.emoji || ''}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground text-sm">{occ.classItem.name}</span>
                        {member && (
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', color?.bg, color?.text)}>
                            {member.name}
                          </span>
                        )}
                      </div>
                      {(occ.classItem.startTime || occ.classItem.endTime) && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock size={10} />
                          {occ.classItem.startTime}{occ.classItem.endTime ? ` - ${occ.classItem.endTime}` : ''}
                        </div>
                      )}
                      {occ.classItem.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin size={10} />
                          {occ.classItem.location}
                        </div>
                      )}
                      {occ.classItem.description && (
                        <p className="text-xs text-muted-foreground mt-1">{occ.classItem.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => openEdit(occ.classItem)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Edit class"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Class Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDialogOpen(false)}>
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">{editingId ? 'Edit Class' : 'Add Class'}</h3>
              <button onClick={() => setDialogOpen(false)} className="p-1 rounded hover:bg-muted" aria-label="Close dialog">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Class Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Piano Lesson"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Emoji */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Emoji (optional)</label>
                <input
                  type="text"
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="e.g. piano emoji"
                  className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Kid</label>
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select kid...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Date (optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Repeats</label>
                <select
                  value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value as RecurrenceType })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Custom days */}
              {form.recurrence === 'custom' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Days</label>
                  <div className="flex gap-1.5">
                    {DAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const days = form.customDays.includes(i)
                            ? form.customDays.filter((d) => d !== i)
                            : [...form.customDays, i]
                          setForm({ ...form, customDays: days })
                        }}
                        className={cn(
                          'w-9 h-9 rounded-full text-xs font-bold transition-colors',
                          form.customDays.includes(i)
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Location (optional)</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Music Academy, 123 Main St"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Notes (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Bring music sheets"
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-border flex gap-2">
              {editingId && (
                <button
                  onClick={() => handleDelete(editingId)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.assigneeId}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {editingId ? 'Save' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
