import { useState, useMemo, useCallback } from 'react'
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  isSameMonth,
  eachDayOfInterval,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, MapPin, Clock, Pencil, Trash2, X, Printer } from 'lucide-react'
import { useClassStore } from '../../store/class-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { getMonthDays } from '../../lib/calendar'
import type { ExtraClass, RecurrenceType, CalendarViewMode, ClassOccurrence } from '../../types'
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

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => i + 6) // 6am to 9pm (6..21)

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

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12) return hour === 0 ? '12 AM' : '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

function parseTimeToHour(time: string): number {
  const [h] = time.split(':').map(Number)
  return h
}

/** Get the hex color for a MEMBER_COLORS entry for print export */
const COLOR_HEX_MAP: Record<string, string> = {
  'bg-blue-200': '#bfdbfe',
  'bg-green-200': '#bbf7d0',
  'bg-orange-200': '#fed7aa',
  'bg-purple-200': '#e9d5ff',
  'bg-pink-200': '#fbcfe8',
  'bg-teal-200': '#99f6e4',
  'bg-red-200': '#fecaca',
  'bg-amber-200': '#fde68a',
}

const TEXT_HEX_MAP: Record<string, string> = {
  'text-blue-900': '#1e3a5f',
  'text-green-900': '#14532d',
  'text-orange-900': '#7c2d12',
  'text-purple-900': '#3b0764',
  'text-pink-900': '#831843',
  'text-teal-900': '#134e4a',
  'text-red-900': '#7f1d1d',
  'text-amber-900': '#78350f',
}

export default function ClassCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClassFormData>(emptyForm())
  const [kidFilter, setKidFilter] = useState<Set<string>>(new Set())

  const { classes, addClass, removeClass, updateClass, getOccurrencesForRange } = useClassStore()
  const members = useMemberStore((s) => s.members)

  // If kidFilter is empty, show all (no filter active)
  const isFilterActive = kidFilter.size > 0

  // Compute date ranges based on view mode
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      return {
        rangeStart: startOfWeek(monthStart, { weekStartsOn: 0 }),
        rangeEnd: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      }
    } else if (viewMode === 'week') {
      return {
        rangeStart: startOfWeek(currentDate, { weekStartsOn: 0 }),
        rangeEnd: endOfWeek(currentDate, { weekStartsOn: 0 }),
      }
    } else {
      // day
      return { rangeStart: currentDate, rangeEnd: currentDate }
    }
  }, [currentDate, viewMode])

  const days = useMemo(() => {
    if (viewMode === 'month') return getMonthDays(currentDate)
    if (viewMode === 'week') return eachDayOfInterval({ start: rangeStart, end: rangeEnd })
    return [currentDate]
  }, [currentDate, viewMode, rangeStart, rangeEnd])

  const occurrences = useMemo(
    () => getOccurrencesForRange(rangeStart, rangeEnd),
    [classes, rangeStart.getTime(), rangeEnd.getTime()]
  )

  // Filter occurrences by kid
  const filteredOccurrences = useMemo(() => {
    if (!isFilterActive) return occurrences
    return occurrences.filter((occ) => kidFilter.has(occ.classItem.assigneeId))
  }, [occurrences, kidFilter, isFilterActive])

  const occByDate = useMemo(() => {
    const map: Record<string, ClassOccurrence[]> = {}
    for (const occ of filteredOccurrences) {
      if (!map[occ.date]) map[occ.date] = []
      map[occ.date].push(occ)
    }
    return map
  }, [filteredOccurrences])

  const selectedDayStr = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedOccs = selectedDayStr ? (occByDate[selectedDayStr] ?? []) : []

  // Navigation
  const navigatePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const navigateNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const headerTitle = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy')
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 })
      const we = endOfWeek(currentDate, { weekStartsOn: 0 })
      return `${format(ws, 'MMM d')} - ${format(we, 'MMM d, yyyy')}`
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }, [currentDate, viewMode])

  const toggleKidFilter = (memberId: string) => {
    setKidFilter((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

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

  // Export weekly timetable to print
  const exportWeeklyPdf = useCallback(() => {
    const ws = startOfWeek(currentDate, { weekStartsOn: 0 })
    const we = endOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = eachDayOfInterval({ start: ws, end: we })
    const weekOccs = getOccurrencesForRange(ws, we).filter(
      (occ) => !isFilterActive || kidFilter.has(occ.classItem.assigneeId)
    )

    // Build lookup: date -> hour -> occurrences
    const grid: Record<string, Record<number, ClassOccurrence[]>> = {}
    for (const day of weekDays) {
      const dateStr = format(day, 'yyyy-MM-dd')
      grid[dateStr] = {}
    }
    for (const occ of weekOccs) {
      if (!occ.classItem.startTime) continue
      const hour = parseTimeToHour(occ.classItem.startTime)
      if (!grid[occ.date]) continue
      if (!grid[occ.date][hour]) grid[occ.date][hour] = []
      grid[occ.date][hour].push(occ)
    }

    // Also collect classes without time
    const noTimeOccs: Record<string, ClassOccurrence[]> = {}
    for (const occ of weekOccs) {
      if (!occ.classItem.startTime) {
        if (!noTimeOccs[occ.date]) noTimeOccs[occ.date] = []
        noTimeOccs[occ.date].push(occ)
      }
    }

    const buildCell = (occs: ClassOccurrence[] | undefined) => {
      if (!occs || occs.length === 0) return ''
      return occs
        .map((occ) => {
          const member = members.find((m) => m.id === occ.classItem.assigneeId)
          const color = member ? getMemberColor(member) : null
          const bgHex = color ? (COLOR_HEX_MAP[color.bg] ?? '#e5e7eb') : '#e5e7eb'
          const textHex = color ? (TEXT_HEX_MAP[color.text] ?? '#1f2937') : '#1f2937'
          const name = member?.name ?? ''
          const time = occ.classItem.startTime
            ? `${occ.classItem.startTime}${occ.classItem.endTime ? '-' + occ.classItem.endTime : ''}`
            : ''
          return `<div style="background:${bgHex};color:${textHex};padding:2px 4px;border-radius:4px;margin:1px 0;font-size:11px;">
            <strong>${occ.classItem.emoji ?? ''} ${occ.classItem.name}</strong><br/>
            <span>${name}</span>
            ${time ? `<br/><span>${time}</span>` : ''}
            ${occ.classItem.location ? `<br/><span>${occ.classItem.location}</span>` : ''}
          </div>`
        })
        .join('')
    }

    const hasNoTimeClasses = Object.values(noTimeOccs).some((arr) => arr.length > 0)

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Extra Classes - Week of ${format(ws, 'MMM d, yyyy')}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; color: #1f2937; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: normal; color: #6b7280; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { background: #f3f4f6; padding: 6px 4px; font-size: 12px; border: 1px solid #d1d5db; text-align: center; }
  td { border: 1px solid #d1d5db; padding: 2px; vertical-align: top; font-size: 11px; min-height: 30px; }
  .time-col { width: 60px; text-align: right; padding-right: 6px; font-size: 11px; color: #6b7280; font-weight: 600; }
  @media print {
    body { margin: 10px; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head><body>
<h1>Extra Classes - Week of ${format(ws, 'MMMM d, yyyy')}</h1>
<h2>${format(ws, 'MMM d')} - ${format(we, 'MMM d, yyyy')}</h2>
<table>
<thead>
<tr>
  <th class="time-col">Time</th>
  ${weekDays.map((d) => `<th>${format(d, 'EEE')}<br/>${format(d, 'M/d')}</th>`).join('')}
</tr>
</thead>
<tbody>
${hasNoTimeClasses ? `<tr>
  <td class="time-col" style="font-style:italic;">No time</td>
  ${weekDays.map((d) => `<td>${buildCell(noTimeOccs[format(d, 'yyyy-MM-dd')])}</td>`).join('')}
</tr>` : ''}
${TIME_SLOTS.map(
  (hour) =>
    `<tr>
      <td class="time-col">${formatHour(hour)}</td>
      ${weekDays
        .map((d) => {
          const dateStr = format(d, 'yyyy-MM-dd')
          return `<td>${buildCell(grid[dateStr]?.[hour])}</td>`
        })
        .join('')}
    </tr>`
).join('')}
</tbody>
</table>
</body></html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.onload = () => printWindow.print()
    }
  }, [currentDate, classes, members, kidFilter, isFilterActive])

  // ---- RENDER HELPERS ----

  const renderKidFilter = () => {
    if (members.length === 0) return null
    return (
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border overflow-x-auto no-scrollbar shrink-0">
        <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">Filter:</span>
        {members.map((member) => {
          const color = getMemberColor(member)
          const active = !isFilterActive || kidFilter.has(member.id)
          return (
            <button
              key={member.id}
              onClick={() => toggleKidFilter(member.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold transition-all shrink-0',
                active ? `${color.bg} ${color.text}` : 'bg-muted/50 text-muted-foreground/50'
              )}
            >
              {member.name}
            </button>
          )
        })}
        {isFilterActive && (
          <button
            onClick={() => setKidFilter(new Set())}
            className="px-2 py-1 rounded-full text-xs font-medium text-muted-foreground hover:bg-muted transition-colors shrink-0"
          >
            Clear
          </button>
        )}
      </div>
    )
  }

  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate)
    return (
      <div className="flex-1 overflow-auto min-h-0 p-2">
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {monthDays.map((day) => {
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
                <span
                  className={cn(
                    'text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full',
                    today && 'bg-primary text-white',
                    !today && !isCurrentMonth && 'text-muted-foreground/50',
                    !today && isCurrentMonth && 'text-foreground'
                  )}
                >
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
                      {occ.classItem.emoji ? `${occ.classItem.emoji} ` : ''}
                      {occ.classItem.name}
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
    )
  }

  const renderWeekView = () => {
    const weekDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd })

    // Build grid: hour -> day -> occurrences
    const timeGrid: Record<number, Record<string, ClassOccurrence[]>> = {}
    for (const hour of TIME_SLOTS) {
      timeGrid[hour] = {}
      for (const day of weekDays) {
        timeGrid[hour][format(day, 'yyyy-MM-dd')] = []
      }
    }

    const noTimeOccs: Record<string, ClassOccurrence[]> = {}
    for (const day of weekDays) {
      noTimeOccs[format(day, 'yyyy-MM-dd')] = []
    }

    for (const occ of filteredOccurrences) {
      if (occ.classItem.startTime) {
        const hour = parseTimeToHour(occ.classItem.startTime)
        if (timeGrid[hour]?.[occ.date]) {
          timeGrid[hour][occ.date].push(occ)
        }
      } else {
        if (noTimeOccs[occ.date]) {
          noTimeOccs[occ.date].push(occ)
        }
      }
    }

    const hasNoTimeClasses = Object.values(noTimeOccs).some((arr) => arr.length > 0)

    return (
      <div className="flex-1 overflow-auto min-h-0">
        <table className="w-full border-collapse table-fixed">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-16 bg-card border border-border p-1 text-xs font-semibold text-muted-foreground">
                Time
              </th>
              {weekDays.map((day) => {
                const today = isToday(day)
                return (
                  <th
                    key={format(day, 'yyyy-MM-dd')}
                    className={cn(
                      'bg-card border border-border p-1.5 text-center',
                      today && 'bg-primary/5'
                    )}
                  >
                    <div className="text-xs font-semibold text-muted-foreground">{format(day, 'EEE')}</div>
                    <div
                      className={cn(
                        'text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full mx-auto',
                        today && 'bg-primary text-white'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {hasNoTimeClasses && (
              <tr>
                <td className="border border-border p-1 text-[10px] text-muted-foreground text-right pr-2 align-top font-medium italic">
                  No time
                </td>
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const occs = noTimeOccs[dateStr]
                  return (
                    <td
                      key={dateStr}
                      className={cn('border border-border p-0.5 align-top', isToday(day) && 'bg-primary/5')}
                    >
                      {occs.map((occ) => renderWeekCell(occ))}
                    </td>
                  )
                })}
              </tr>
            )}
            {TIME_SLOTS.map((hour) => (
              <tr key={hour}>
                <td className="border border-border p-1 text-[10px] text-muted-foreground text-right pr-2 align-top font-medium">
                  {formatHour(hour)}
                </td>
                {weekDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const occs = timeGrid[hour][dateStr]
                  return (
                    <td
                      key={dateStr}
                      className={cn(
                        'border border-border p-0.5 align-top min-h-[36px]',
                        isToday(day) && 'bg-primary/5'
                      )}
                    >
                      {occs.map((occ) => renderWeekCell(occ))}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderWeekCell = (occ: ClassOccurrence) => {
    const member = members.find((m) => m.id === occ.classItem.assigneeId)
    const color = member ? getMemberColor(member) : null
    return (
      <button
        key={occ.classId + occ.date}
        onClick={() => openEdit(occ.classItem)}
        className={cn(
          'w-full text-left rounded p-1 mb-0.5 transition-opacity hover:opacity-80',
          color?.bg ?? 'bg-blue-100 dark:bg-blue-900/30',
          color?.text ?? 'text-blue-700 dark:text-blue-300'
        )}
      >
        <div className="text-[10px] font-bold leading-tight truncate">
          {occ.classItem.emoji ? `${occ.classItem.emoji} ` : ''}
          {occ.classItem.name}
        </div>
        {member && <div className="text-[9px] leading-tight truncate opacity-80">{member.name}</div>}
        {occ.classItem.startTime && (
          <div className="text-[9px] leading-tight opacity-70">
            {occ.classItem.startTime}
            {occ.classItem.endTime ? `-${occ.classItem.endTime}` : ''}
          </div>
        )}
        {occ.classItem.location && (
          <div className="text-[9px] leading-tight truncate opacity-70">{occ.classItem.location}</div>
        )}
      </button>
    )
  }

  const renderDayView = () => {
    const dateStr = format(currentDate, 'yyyy-MM-dd')
    const dayOccs = occByDate[dateStr] ?? []
    const today = isToday(currentDate)

    // Sort by time
    const withTime = dayOccs.filter((o) => o.classItem.startTime).sort((a, b) => (a.classItem.startTime ?? '').localeCompare(b.classItem.startTime ?? ''))
    const withoutTime = dayOccs.filter((o) => !o.classItem.startTime)

    const allSorted = [...withTime, ...withoutTime]

    return (
      <div className="flex-1 overflow-auto min-h-0 p-4">
        {allSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No classes scheduled for this day</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-w-lg mx-auto">
            {allSorted.map((occ) => {
              const member = members.find((m) => m.id === occ.classItem.assigneeId)
              const color = member ? getMemberColor(member) : null
              return (
                <div
                  key={occ.classId + occ.date}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border border-border/50',
                    color ? `${color.accent} border-l-4` : 'border-l-4 border-l-blue-500',
                    'bg-card'
                  )}
                >
                  <div className="flex flex-col items-center min-w-[50px]">
                    {occ.classItem.startTime ? (
                      <>
                        <span className="text-sm font-bold text-foreground">{occ.classItem.startTime}</span>
                        {occ.classItem.endTime && (
                          <span className="text-[10px] text-muted-foreground">{occ.classItem.endTime}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No time</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {occ.classItem.emoji && <span className="text-lg">{occ.classItem.emoji}</span>}
                      <span className="font-bold text-foreground text-sm">{occ.classItem.name}</span>
                      {member && (
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-medium',
                            color?.bg,
                            color?.text
                          )}
                        >
                          {member.name}
                        </span>
                      )}
                    </div>
                    {occ.classItem.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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
    )
  }

  const renderSelectedDayPanel = () => {
    if (!selectedDay || viewMode !== 'month') return null
    return (
      <div className="border-t border-border bg-card px-4 py-3 max-h-[35vh] overflow-auto shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-foreground text-sm">{format(selectedDay, 'EEEE, MMMM d')}</h3>
          <button
            onClick={() => setSelectedDay(null)}
            className="p-1 rounded hover:bg-muted"
            aria-label="Close detail panel"
          >
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
                        <span
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full font-medium',
                            color?.bg,
                            color?.text
                          )}
                        >
                          {member.name}
                        </span>
                      )}
                    </div>
                    {(occ.classItem.startTime || occ.classItem.endTime) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock size={10} />
                        {occ.classItem.startTime}
                        {occ.classItem.endTime ? ` - ${occ.classItem.endTime}` : ''}
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
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrev}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-foreground min-w-[180px] text-center">{headerTitle}</h2>
          <button
            onClick={navigateNext}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold transition-colors capitalize',
                  viewMode === mode
                    ? 'bg-primary text-white'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          {/* Export PDF button */}
          <button
            onClick={exportWeeklyPdf}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Export weekly timetable to PDF"
            title="Print weekly timetable"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print</span>
          </button>
          {/* Add class button */}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add Class
          </button>
        </div>
      </div>

      {/* Kid filter */}
      {renderKidFilter()}

      {/* Calendar content */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Selected day detail panel (month view only) */}
      {renderSelectedDayPanel()}

      {/* Add/Edit Class Dialog */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDialogOpen(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">{editingId ? 'Edit Class' : 'Add Class'}</h3>
              <button
                onClick={() => setDialogOpen(false)}
                className="p-1 rounded hover:bg-muted"
                aria-label="Close dialog"
              >
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
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Emoji (optional)
                </label>
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
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
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
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  End Date (optional)
                </label>
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
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
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
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Location (optional)
                </label>
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
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Notes (optional)
                </label>
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
