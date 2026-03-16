import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  isSameWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
} from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Trash2, X, Printer } from 'lucide-react'
import { useClassStore } from '../../store/class-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { getMonthDays, getWeekDays } from '../../lib/calendar'
import type { ExtraClass, RecurrenceType, CalendarViewMode, ClassOccurrence } from '../../types'
import { cn } from '../../lib/utils'

const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom days' },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5) // 5am to 11pm, matching chore calendar

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
  return `${String(hour).padStart(2, '0')}:00`
}

function getHourFromTime(time: string): number {
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

// ── Class card components matching ChoreCard patterns ──

function ClassCardCompact({ occ, onClick }: { occ: ClassOccurrence; onClick: () => void }) {
  const members = useMemberStore((s) => s.members)
  const member = members.find((m) => m.id === occ.classItem.assigneeId)
  const color = member ? getMemberColor(member) : null

  const cardClasses = color
    ? `bg-card border-l-4 ${color.accent} text-foreground border border-border shadow-md dark:shadow-none`
    : 'bg-card border-l-4 border-l-neutral-400 text-foreground border border-border shadow-md dark:shadow-none'

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`flex items-center gap-1 xl:gap-1.5 rounded-lg px-1.5 xl:px-2 py-1 text-xs xl:text-sm cursor-pointer transition-colors ${cardClasses}`}
    >
      {occ.classItem.emoji && (
        <span className="shrink-0 text-sm xl:text-xs">{occ.classItem.emoji}</span>
      )}
      <span className="truncate font-semibold">
        {occ.classItem.startTime && (
          <span className="font-normal text-muted-foreground hidden xl:inline">{occ.classItem.startTime} </span>
        )}
        {occ.classItem.name}
      </span>
      {member?.avatar ? (
        <img src={member.avatar} alt="" className="shrink-0 h-4 w-4 rounded-full object-cover ml-auto hidden xl:block" />
      ) : null}
    </div>
  )
}

function ClassCardFull({ occ, onClick }: { occ: ClassOccurrence; onClick: () => void }) {
  const members = useMemberStore((s) => s.members)
  const member = members.find((m) => m.id === occ.classItem.assigneeId)
  const color = member ? getMemberColor(member) : null

  const cardClasses = color
    ? `bg-card border-l-4 ${color.accent} text-foreground border border-border shadow-md dark:shadow-none`
    : 'bg-card border-l-4 border-l-neutral-400 text-foreground border border-border shadow-md dark:shadow-none'

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[48px] text-sm cursor-pointer transition-colors ${cardClasses}`}
    >
      {occ.classItem.emoji && (
        <span className="shrink-0 text-lg">{occ.classItem.emoji}</span>
      )}
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-semibold truncate">
          {occ.classItem.name}
        </span>
        <span className="block text-xs text-muted-foreground">
          {member?.name ?? 'Unassigned'}
          {occ.classItem.startTime && ` \u00b7 ${occ.classItem.startTime}`}
          {occ.classItem.endTime && `-${occ.classItem.endTime}`}
          {occ.classItem.location && ` \u00b7 ${occ.classItem.location}`}
        </span>
      </div>
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

export default function ClassCalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClassFormData>(emptyForm())
  const [kidFilter, setKidFilter] = useState<Set<string>>(new Set())

  // Mobile month view: selected day
  const [monthSelectedDay, setMonthSelectedDay] = useState<Date>(new Date())
  // Mobile week view: selected day index
  const [weekSelectedDayIndex, setWeekSelectedDayIndex] = useState(0)

  // Picker state (matching CalendarHeader)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(() => startOfMonth(currentDate))
  const [pickerYear, setPickerYear] = useState(() => currentDate.getFullYear())
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { classes, addClass, removeClass, updateClass, getOccurrencesForRange } = useClassStore()
  const members = useMemberStore((s) => s.members)

  const isFilterActive = kidFilter.size > 0

  // Sync picker context when currentDate changes
  useEffect(() => {
    setPickerMonth(startOfMonth(currentDate))
    setPickerYear(currentDate.getFullYear())
  }, [currentDate])

  // Close on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  // Close picker when view mode changes
  useEffect(() => {
    setPickerOpen(false)
  }, [viewMode])

  // Sync month selected day when currentDate changes (matching MonthView)
  useEffect(() => {
    const monthDays = getMonthDays(currentDate)
    const today = monthDays.find((d) => isToday(d))
    if (today) {
      setMonthSelectedDay(today)
    } else {
      const firstOfMonth = monthDays.find((d) => isSameMonth(d, currentDate))
      if (firstOfMonth) setMonthSelectedDay(firstOfMonth)
    }
  }, [currentDate])

  // Sync week selected day index when currentDate changes (matching WeekView)
  useEffect(() => {
    const days = getWeekDays(currentDate)
    const todayIdx = days.findIndex((d) => isToday(d))
    setWeekSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0)
  }, [currentDate])

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
      return { rangeStart: currentDate, rangeEnd: currentDate }
    }
  }, [currentDate, viewMode])

  const occurrences = useMemo(
    () => getOccurrencesForRange(rangeStart, rangeEnd),
    [classes, rangeStart.getTime(), rangeEnd.getTime()]
  )

  const filteredOccurrences = useMemo(() => {
    if (!isFilterActive) return occurrences
    return occurrences.filter((occ) => kidFilter.has(occ.classItem.assigneeId))
  }, [occurrences, kidFilter, isFilterActive])

  const occByDate = useMemo(() => {
    const map = new Map<string, ClassOccurrence[]>()
    for (const occ of filteredOccurrences) {
      const existing = map.get(occ.date) ?? []
      existing.push(occ)
      map.set(occ.date, existing)
    }
    return map
  }, [filteredOccurrences])

  // Navigation — matching CalendarView exactly
  const handlePrev = () => {
    setCurrentDate((d) => {
      if (viewMode === 'month') return subMonths(d, 1)
      if (viewMode === 'week') return subWeeks(d, 1)
      return subDays(d, 1)
    })
  }

  const handleNext = () => {
    setCurrentDate((d) => {
      if (viewMode === 'month') return addMonths(d, 1)
      if (viewMode === 'week') return addWeeks(d, 1)
      return addDays(d, 1)
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    setPickerOpen(false)
  }

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

  const openAdd = (date?: Date, time?: string) => {
    setEditingId(null)
    const f = emptyForm()
    if (date) f.startDate = format(date, 'yyyy-MM-dd')
    if (time) {
      f.startTime = time
      const hour = parseInt(time.split(':')[0], 10)
      f.endTime = `${String(hour + 1).padStart(2, '0')}:00`
    }
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

    const timeSlots = Array.from({ length: 16 }, (_, i) => i + 6)

    const grid: Record<string, Record<number, ClassOccurrence[]>> = {}
    for (const day of weekDays) {
      const dateStr = format(day, 'yyyy-MM-dd')
      grid[dateStr] = {}
    }
    for (const occ of weekOccs) {
      if (!occ.classItem.startTime) continue
      const hour = getHourFromTime(occ.classItem.startTime)
      if (!grid[occ.date]) continue
      if (!grid[occ.date][hour]) grid[occ.date][hour] = []
      grid[occ.date][hour].push(occ)
    }

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
          return `<div style="background:${bgHex};color:${textHex};padding:4px 6px;border-radius:4px;margin:1px 0;font-size:13px;">
            <strong>${occ.classItem.emoji ?? ''} ${occ.classItem.name}</strong><br/>
            <span>${name}</span>
            ${time ? `<br/><span>${time}</span>` : ''}
            ${occ.classItem.location ? `<br/><span>${occ.classItem.location}</span>` : ''}
          </div>`
        })
        .join('')
    }

    const hasNoTimeClasses = Object.values(noTimeOccs).some((arr) => arr.length > 0)
    const formatPrintHour = (h: number) => `${String(h).padStart(2, '0')}:00`

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>Extra Classes - Week of ${format(ws, 'MMM d, yyyy')}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; color: #1f2937; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: normal; color: #6b7280; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { background: #f3f4f6; padding: 6px 4px; font-size: 14px; border: 1px solid #d1d5db; text-align: center; }
  td { border: 1px solid #d1d5db; padding: 4px; vertical-align: top; font-size: 13px; min-height: 50px; }
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
${timeSlots.map(
  (hour) =>
    `<tr>
      <td class="time-col">${formatPrintHour(hour)}</td>
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

  // ── HEADER — matching CalendarHeader exactly ──
  const triggerClasses = 'flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted transition-colors w-full xl:w-auto'
  const todayBtnClasses = 'shrink-0 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors'

  const renderHeader = () => {
    // ── DAY VIEW HEADER ──
    if (viewMode === 'day') {
      const pickerMonthStart = startOfMonth(pickerMonth)
      const pickerMonthEnd = endOfMonth(pickerMonth)
      const calStart = startOfWeek(pickerMonthStart, { weekStartsOn: 0 })
      const calEnd = endOfWeek(pickerMonthEnd, { weekStartsOn: 0 })
      const pickerDays = eachDayOfInterval({ start: calStart, end: calEnd })

      return (
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={handlePrev} className="rounded-md p-2 hover:bg-muted transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>

          <div className="relative flex-1 xl:flex-none" ref={dropdownRef}>
            <button onClick={() => setPickerOpen((o) => !o)} className={triggerClasses}>
              <span className="text-base font-semibold truncate">
                {format(currentDate, 'EEEE, MMMM d, yyyy')}
              </span>
              <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {pickerOpen && (
              <div className="absolute top-full left-0 right-0 xl:left-auto xl:right-auto xl:w-[320px] mt-1 z-50 rounded-xl border border-border bg-background shadow-lg picker-dropdown">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <button onClick={() => setPickerMonth((m) => subMonths(m, 1))} className="rounded-md p-1 hover:bg-muted transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-bold">{format(pickerMonth, 'MMMM yyyy')}</span>
                  <button onClick={() => setPickerMonth((m) => addMonths(m, 1))} className="rounded-md p-1 hover:bg-muted transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-7 px-2 pt-2">
                  {WEEKDAYS_SHORT.map((d, i) => (
                    <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 px-2 pb-3">
                  {pickerDays.map((day) => {
                    const dateKey = format(day, 'yyyy-MM-dd')
                    const inMonth = isSameMonth(day, pickerMonth)
                    const today = isToday(day)
                    const selected = isSameDay(day, currentDate)
                    const hasTasks = occByDate.has(dateKey)
                    return (
                      <button
                        key={dateKey}
                        onClick={() => { setCurrentDate(day); setPickerOpen(false) }}
                        className={`flex flex-col items-center py-1 rounded-lg transition-colors ${selected ? 'bg-primary/10' : 'hover:bg-muted'}`}
                      >
                        <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                          today && selected ? 'bg-primary text-primary-foreground'
                            : today ? 'bg-primary text-primary-foreground'
                            : selected ? 'bg-foreground text-background'
                            : inMonth ? 'text-foreground' : 'text-muted-foreground/40'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {hasTasks
                          ? <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${today || selected ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                          : <span className="h-1.5 mt-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleToday} className={todayBtnClasses}>Today</button>

          <button onClick={handleNext} className="rounded-md p-2 hover:bg-muted transition-colors shrink-0">
            <ChevronRight size={20} />
          </button>
        </div>
      )
    }

    // ── WEEK VIEW HEADER ──
    if (viewMode === 'week') {
      const monthStart = startOfMonth(pickerMonth)
      const monthEnd = endOfMonth(pickerMonth)
      const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 })

      const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekLabel = `${format(currentWeekStart, 'MMM d')} \u2013 ${format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), 'MMM d, yyyy')}`

      return (
        <div className="flex items-center gap-2 px-4 py-3">
          <button onClick={handlePrev} className="rounded-md p-2 hover:bg-muted transition-colors shrink-0">
            <ChevronLeft size={20} />
          </button>

          <div className="relative flex-1 xl:flex-none" ref={dropdownRef}>
            <button onClick={() => setPickerOpen((o) => !o)} className={triggerClasses}>
              <span className="text-base font-semibold truncate">{weekLabel}</span>
              <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {pickerOpen && (
              <div className="absolute top-full left-0 right-0 xl:left-auto xl:right-auto xl:w-[300px] mt-1 z-50 rounded-xl border border-border bg-background shadow-lg picker-dropdown">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <button onClick={() => setPickerMonth((m) => subMonths(m, 1))} className="rounded-md p-1 hover:bg-muted transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-bold">{format(pickerMonth, 'MMMM yyyy')}</span>
                  <button onClick={() => setPickerMonth((m) => addMonths(m, 1))} className="rounded-md p-1 hover:bg-muted transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="py-1 max-h-[280px] overflow-y-auto">
                  {weekStarts.map((ws) => {
                    const we = endOfWeek(ws, { weekStartsOn: 0 })
                    const isCurrentWeek = isSameWeek(ws, currentDate, { weekStartsOn: 0 })
                    const hasToday = eachDayOfInterval({ start: ws, end: we }).some((d) => isToday(d))
                    const label = `${format(ws, 'MMM d')} \u2013 ${format(we, 'MMM d')}`

                    return (
                      <button
                        key={format(ws, 'yyyy-MM-dd')}
                        onClick={() => { setCurrentDate(ws); setPickerOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                          isCurrentWeek
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span className="flex-1">{label}</span>
                        {hasToday && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">Today</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleToday} className={todayBtnClasses}>Today</button>

          <button onClick={handleNext} className="rounded-md p-2 hover:bg-muted transition-colors shrink-0">
            <ChevronRight size={20} />
          </button>
        </div>
      )
    }

    // ── MONTH VIEW HEADER ──
    const MONTH_NAMES = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    const nowMonth = new Date().getMonth()
    const nowYear = new Date().getFullYear()

    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={handlePrev} className="rounded-md p-2 hover:bg-muted transition-colors shrink-0">
          <ChevronLeft size={20} />
        </button>

        <div className="relative flex-1 xl:flex-none" ref={dropdownRef}>
          <button onClick={() => setPickerOpen((o) => !o)} className={triggerClasses}>
            <span className="text-base font-semibold truncate">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {pickerOpen && (
            <div className="absolute top-full left-0 right-0 xl:left-auto xl:right-auto xl:w-[280px] mt-1 z-50 rounded-xl border border-border bg-background shadow-lg picker-dropdown">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <button onClick={() => setPickerYear((y) => y - 1)} className="rounded-md p-1 hover:bg-muted transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold">{pickerYear}</span>
                <button onClick={() => setPickerYear((y) => y + 1)} className="rounded-md p-1 hover:bg-muted transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 p-3">
                {MONTH_NAMES.map((name, idx) => {
                  const isSelected = idx === currentMonth && pickerYear === currentYear
                  const isNow = idx === nowMonth && pickerYear === nowYear

                  return (
                    <button
                      key={idx}
                      onClick={() => { setCurrentDate(new Date(pickerYear, idx, 1)); setPickerOpen(false) }}
                      className={`rounded-lg px-2 py-2.5 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : isNow
                            ? 'bg-primary/15 text-primary font-bold'
                            : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleToday} className={todayBtnClasses}>Today</button>

        <button onClick={handleNext} className="rounded-md p-2 hover:bg-muted transition-colors shrink-0">
          <ChevronRight size={20} />
        </button>
      </div>
    )
  }

  // ── FILTER BAR — matching FilterBar exactly ──
  const renderFilterBar = () => {
    return (
      <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-b border-border bg-background">
        {/* All chip — matching status filter style */}
        <button
          onClick={() => setKidFilter(new Set())}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors min-h-[36px] ${
            !isFilterActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>

        {/* Divider */}
        <div className="shrink-0 w-px bg-border self-stretch my-0.5" />

        {/* Kid chips — matching FilterBar member chips */}
        {members.map((member) => {
          const color = getMemberColor(member)
          const active = isFilterActive && kidFilter.has(member.id)
          return (
            <button
              key={member.id}
              onClick={() => toggleKidFilter(member.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors min-h-[36px] flex items-center gap-1.5 ${
                active
                  ? `${color.bg} ${color.darkBg} ${color.text} ${color.darkText}`
                  : !isFilterActive
                    ? `${color.bg} ${color.darkBg} ${color.text} ${color.darkText}`
                    : 'bg-muted text-muted-foreground opacity-50'
              }`}
            >
              {member.avatar ? (
                <img src={member.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
              ) : (
                <span className={`h-4 w-4 rounded-full ${color.dot} inline-flex items-center justify-center text-white text-[10px] font-bold`}>
                  {member.name.charAt(0).toUpperCase()}
                </span>
              )}
              {member.name}
            </button>
          )
        })}

        {/* Action buttons — Export/Print + Add */}
        <div className="shrink-0 w-px bg-border self-stretch my-0.5" />
        <button
          onClick={exportWeeklyPdf}
          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors min-h-[36px] flex items-center gap-1.5 bg-muted text-muted-foreground hover:text-foreground"
          title="Print weekly timetable"
        >
          <Printer size={14} />
          <span className="hidden sm:inline">Print</span>
        </button>
        <button
          onClick={() => openAdd()}
          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors min-h-[36px] flex items-center gap-1.5 bg-primary text-primary-foreground"
        >
          <Plus size={14} />
          Add Class
        </button>
      </div>
    )
  }

  // ── MONTH VIEW — matching MonthView exactly ──
  const renderMonthView = () => {
    const monthDays = getMonthDays(currentDate)
    const selectedDay = monthSelectedDay
    const setSelectedDay = setMonthSelectedDay

    const selectedDateKey = format(selectedDay, 'yyyy-MM-dd')
    const selectedDayOccurrences = occByDate.get(selectedDateKey) ?? []

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop: traditional grid matching MonthView */}
        <div className="hidden xl:flex xl:flex-col xl:flex-1">
          <div className="grid grid-cols-7">
            {WEEKDAYS_LONG.map((day) => (
              <div
                key={day}
                className="border border-border px-2 py-2 text-sm font-bold text-foreground text-center bg-muted"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1">
            {monthDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayOccs = occByDate.get(dateKey) ?? []
              const today = isToday(day)
              const inMonth = isSameMonth(day, currentDate)

              return (
                <div
                  key={dateKey}
                  onDoubleClick={() => openAdd(day)}
                  className={`border border-border p-1 cursor-pointer hover:bg-accent/50 transition-colors min-h-[100px] ${
                    today ? 'bg-primary/12' : !inMonth ? 'bg-muted/60' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-sm font-semibold leading-none ${
                        today
                          ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
                          : !inMonth
                            ? 'text-muted-foreground'
                            : 'text-foreground'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayOccs.map((occ) => (
                      <ClassCardCompact
                        key={`${occ.classId}-${occ.date}`}
                        occ={occ}
                        onClick={() => openEdit(occ.classItem)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: compact mini calendar + selected day tasks — matching MonthView mobile */}
        <div className="flex-1 flex flex-col overflow-hidden xl:hidden">
          {/* Mini calendar grid */}
          <div className="shrink-0 px-2 pt-2 pb-1">
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS_SHORT.map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const inMonth = isSameMonth(day, currentDate)
                const today = isToday(day)
                const isSelected = isSameDay(day, selectedDay)
                const dayOccs = occByDate.get(dateKey) ?? []
                const hasTasks = dayOccs.length > 0

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDay(day)}
                    className={`flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                      isSelected ? 'bg-primary/20' : ''
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                        today && isSelected
                          ? 'bg-primary text-primary-foreground'
                          : today
                            ? 'bg-primary text-primary-foreground'
                            : isSelected
                              ? 'bg-foreground text-background'
                              : inMonth
                                ? 'text-foreground'
                                : 'text-muted-foreground/40'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {hasTasks ? (
                      <span className="h-1.5 w-1.5 rounded-full mt-0.5 bg-primary" />
                    ) : (
                      <span className="h-1.5 mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Divider with selected date label */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-y border-border bg-muted">
            <span className="text-sm font-bold text-foreground">
              {format(selectedDay, 'EEEE, MMM d')}
            </span>
            {isToday(selectedDay) && (
              <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">Today</span>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedDayOccurrences.length} {selectedDayOccurrences.length === 1 ? 'class' : 'classes'}
            </span>
          </div>

          {/* Selected day's classes */}
          <div className="flex-1 overflow-y-auto">
            {selectedDayOccurrences.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 px-4">
                <p className="text-3xl mb-2">📅</p>
                <p className="font-semibold">No classes on this day</p>
                <button
                  onClick={() => openAdd(selectedDay)}
                  className="text-sm text-primary mt-2 hover:underline"
                >
                  Tap to add one
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {selectedDayOccurrences.map((occ) => (
                  <ClassCardFull
                    key={`${occ.classId}-${occ.date}`}
                    occ={occ}
                    onClick={() => openEdit(occ.classItem)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── WEEK VIEW — matching WeekView exactly (CSS grid, not table) ──
  const renderWeekView = () => {
    const days = getWeekDays(currentDate)
    const selectedDayIndex = weekSelectedDayIndex
    const setSelectedDayIndex = setWeekSelectedDayIndex

    function getTimedOccurrences(dateKey: string, hour: number) {
      return (occByDate.get(dateKey) ?? []).filter(
        (occ) => occ.classItem.startTime && getHourFromTime(occ.classItem.startTime) === hour
      )
    }

    function getAllDayOccurrences(dateKey: string) {
      return (occByDate.get(dateKey) ?? []).filter((occ) => !occ.classItem.startTime)
    }

    const selectedDay = days[selectedDayIndex]
    const selectedDateKey = format(selectedDay, 'yyyy-MM-dd')
    const selectedDayOccurrences = occByDate.get(selectedDateKey) ?? []

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop: timeline grid — matching WeekView exactly */}
        <div className="hidden xl:flex xl:flex-col xl:flex-1 overflow-auto">
          {/* Header row */}
          <div className="grid shrink-0 sticky top-0 z-10 bg-background" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
            <div className="border border-border bg-muted" />
            {days.map((day) => {
              const today = isToday(day)
              return (
                <div
                  key={format(day, 'yyyy-MM-dd')}
                  className={`border border-border px-2 py-1.5 text-center bg-muted ${today ? 'bg-primary/20' : ''}`}
                >
                  <span className="text-sm font-bold text-foreground">{format(day, 'EEE')}</span>
                  <br />
                  <span
                    className={`text-base font-bold ${
                      today
                        ? 'bg-primary text-primary-foreground rounded-full inline-flex items-center justify-center w-7 h-7'
                        : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
              )
            })}
          </div>

          {/* All-day row */}
          <div className="grid shrink-0" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
            <div className="border border-border px-1 py-1 text-sm text-muted-foreground font-semibold flex items-start justify-end pr-2">
              All day
            </div>
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const allDay = getAllDayOccurrences(dateKey)
              const todayCol = isToday(day)
              return (
                <div
                  key={dateKey}
                  onClick={() => openAdd(day)}
                  className={`border border-border p-1 min-h-[36px] cursor-pointer hover:bg-accent/50 transition-colors ${todayCol ? 'bg-primary/12' : ''}`}
                >
                  <div className="space-y-0.5">
                    {allDay.map((occ) => (
                      <ClassCardCompact key={`${occ.classId}-${occ.date}`} occ={occ} onClick={() => openEdit(occ.classItem)} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          {HOURS.map((hour) => (
            <div key={hour} className="grid shrink-0" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
              <div className="border border-border px-1 text-xs text-muted-foreground font-semibold flex items-start justify-end pr-2 pt-0.5 h-[60px]">
                {formatHour(hour)}
              </div>
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const hourOccs = getTimedOccurrences(dateKey, hour)
                const todayCol = isToday(day)
                return (
                  <div
                    key={dateKey}
                    onClick={() => openAdd(day, `${String(hour).padStart(2, '0')}:00`)}
                    className={`border border-border p-0.5 h-[60px] cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${todayCol ? 'bg-primary/12' : ''}`}
                  >
                    <div className="space-y-0.5">
                      {hourOccs.map((occ) => (
                        <ClassCardCompact key={`${occ.classId}-${occ.date}`} occ={occ} onClick={() => openEdit(occ.classItem)} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Mobile: horizontal day selector + task list — matching WeekView mobile */}
        <div className="flex-1 flex flex-col overflow-hidden xl:hidden">
          {/* Day selector row */}
          <div className="flex shrink-0 border-b border-border bg-muted">
            {days.map((day, idx) => {
              const today = isToday(day)
              const dateKey = format(day, 'yyyy-MM-dd')
              const dayOccs = occByDate.get(dateKey) ?? []
              const isSelected = idx === selectedDayIndex
              const hasTasks = dayOccs.length > 0

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex-1 flex flex-col items-center py-2 transition-colors relative ${
                    isSelected ? 'bg-primary/20' : ''
                  }`}
                >
                  <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`text-sm font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full ${
                      today && isSelected
                        ? 'bg-primary text-primary-foreground'
                        : today
                          ? 'bg-primary text-primary-foreground'
                          : isSelected
                            ? 'bg-foreground text-background'
                            : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasTasks && (
                    <div className="flex gap-0.5 mt-1">
                      {dayOccs.slice(0, 3).map((_, i) => (
                        <span key={i} className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                      ))}
                      {dayOccs.length > 3 && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary/120' : 'bg-muted-foreground/30'}`} />
                      )}
                    </div>
                  )}
                  {!hasTasks && <div className="h-1.5 mt-1" />}
                </button>
              )
            })}
          </div>

          {/* Selected day's classes */}
          <div className="flex-1 overflow-y-auto">
            {selectedDayOccurrences.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 px-4">
                <p className="text-3xl mb-2">📋</p>
                <p className="font-semibold">No classes on {format(selectedDay, 'EEEE')}</p>
                <button
                  onClick={() => openAdd(selectedDay)}
                  className="text-sm text-primary mt-2 hover:underline"
                >
                  Tap to add one
                </button>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {selectedDayOccurrences.map((occ) => (
                  <ClassCardFull
                    key={`${occ.classId}-${occ.date}`}
                    occ={occ}
                    onClick={() => openEdit(occ.classItem)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── DAY VIEW — matching DayView exactly ──
  const renderDayView = () => {
    const dateKey = format(currentDate, 'yyyy-MM-dd')
    const today = isToday(currentDate)
    const dayOccurrences = occByDate.get(dateKey) ?? []

    const timed = dayOccurrences.filter((occ) => occ.classItem.startTime).sort((a, b) => (a.classItem.startTime! < b.classItem.startTime! ? -1 : 1))
    const allDay = dayOccurrences.filter((occ) => !occ.classItem.startTime)

    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Summary bar */}
        <div
          className={`flex items-center gap-2 px-4 py-2 border-b border-border ${
            today ? 'bg-primary/12' : 'bg-muted/60'
          }`}
        >
          <span className="text-sm text-muted-foreground">
            {dayOccurrences.length} {dayOccurrences.length === 1 ? 'class' : 'classes'}
          </span>
        </div>

        {/* Class list */}
        <div className="flex-1 overflow-y-auto">
          {dayOccurrences.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 px-4">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-lg font-semibold">No classes {today ? 'today' : 'on this day'}</p>
              <button
                onClick={() => openAdd(currentDate)}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                <Plus size={18} />
                Add a class
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {/* All-day classes */}
              {allDay.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">All Day</p>
                  <div className="space-y-2">
                    {allDay.map((occ) => (
                      <ClassCardFull
                        key={`${occ.classId}-${occ.date}`}
                        occ={occ}
                        onClick={() => openEdit(occ.classItem)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Timed classes */}
              {timed.length > 0 && (
                <div>
                  {allDay.length > 0 && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1 mt-3">Scheduled</p>
                  )}
                  <div className="space-y-2">
                    {timed.map((occ) => (
                      <ClassCardFull
                        key={`${occ.classId}-${occ.date}`}
                        occ={occ}
                        onClick={() => openEdit(occ.classItem)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Floating add button — matching DayView */}
        <button
          onClick={() => openAdd(currentDate)}
          className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
          title="Add class"
        >
          <Plus size={22} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden xl:overflow-hidden">
      {/* Header — matching CalendarHeader + view mode toggle */}
      <div className="flex items-center border-b border-border">
        <div className="flex-1">{renderHeader()}</div>
        <div className="flex gap-1 rounded-lg bg-muted p-1 mr-4">
          {(['day', 'week', 'month'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`rounded-md px-2 xl:px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                viewMode === m
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar — matching FilterBar */}
      {renderFilterBar()}

      {/* Calendar content */}
      {viewMode === 'month' ? (
        renderMonthView()
      ) : viewMode === 'week' ? (
        renderWeekView()
      ) : (
        renderDayView()
      )}

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
                className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
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
