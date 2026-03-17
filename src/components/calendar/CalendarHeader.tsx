import { useState, useRef, useEffect } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  eachWeekOfInterval, isToday, isSameDay, isSameMonth, isSameWeek,
  addMonths, subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import type { CalendarViewMode } from '../../types'

interface CalendarHeaderProps {
  currentDate: Date
  viewMode: CalendarViewMode
  datesWithTasks?: Set<string>
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onDateSelect?: (date: Date) => void
}

export default function CalendarHeader({ currentDate, viewMode, datesWithTasks, onPrev, onNext, onToday, onDateSelect }: CalendarHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(() => startOfMonth(currentDate))
  const [pickerYear, setPickerYear] = useState(() => currentDate.getFullYear())
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const handleToday = () => {
    onToday()
    setPickerOpen(false)
  }

  const triggerClasses = 'flex items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted transition-colors w-full xl:w-auto'
  const todayBtnClasses = 'shrink-0 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors'

  // ─── DAY VIEW ───
  if (viewMode === 'day') {
    const pickerMonthStart = startOfMonth(pickerMonth)
    const pickerMonthEnd = endOfMonth(pickerMonth)
    const calStart = startOfWeek(pickerMonthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(pickerMonthEnd, { weekStartsOn: 1 })
    const pickerDays = eachDayOfInterval({ start: calStart, end: calEnd })

    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={onPrev} className="rounded-md p-2.5 hover:bg-muted transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
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
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 px-2 pb-3">
                {pickerDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd')
                  const inMonth = isSameMonth(day, pickerMonth)
                  const today = isToday(day)
                  const selected = isSameDay(day, currentDate)
                  const hasTasks = datesWithTasks?.has(dateKey) ?? false
                  return (
                    <button
                      key={dateKey}
                      onClick={() => { onDateSelect?.(day); setPickerOpen(false) }}
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

        <button onClick={onNext} className="rounded-md p-2.5 hover:bg-muted transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronRight size={20} />
        </button>
      </div>
    )
  }

  // ─── WEEK VIEW ───
  if (viewMode === 'week') {
    const monthStart = startOfMonth(pickerMonth)
    const monthEnd = endOfMonth(pickerMonth)
    const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })

    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekLabel = `${format(currentWeekStart, 'MMM d')} – ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}`

    return (
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={onPrev} className="rounded-md p-2.5 hover:bg-muted transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronLeft size={20} />
        </button>

        <div className="relative flex-1 xl:flex-none" ref={dropdownRef}>
          <button onClick={() => setPickerOpen((o) => !o)} className={triggerClasses}>
            <span className="text-base font-semibold truncate">{weekLabel}</span>
            <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
          </button>

          {pickerOpen && (
            <div className="absolute top-full left-0 right-0 xl:left-auto xl:right-auto xl:w-[300px] mt-1 z-50 rounded-xl border border-border bg-background shadow-lg picker-dropdown">
              {/* Month nav */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                <button onClick={() => setPickerMonth((m) => subMonths(m, 1))} className="rounded-md p-1 hover:bg-muted transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold">{format(pickerMonth, 'MMMM yyyy')}</span>
                <button onClick={() => setPickerMonth((m) => addMonths(m, 1))} className="rounded-md p-1 hover:bg-muted transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Week list */}
              <div className="py-1 max-h-[280px] overflow-y-auto">
                {weekStarts.map((ws) => {
                  const we = endOfWeek(ws, { weekStartsOn: 1 })
                  const isCurrentWeek = isSameWeek(ws, currentDate, { weekStartsOn: 1 })
                  const hasToday = eachDayOfInterval({ start: ws, end: we }).some((d) => isToday(d))
                  const label = `${format(ws, 'MMM d')} – ${format(we, 'MMM d')}`

                  return (
                    <button
                      key={format(ws, 'yyyy-MM-dd')}
                      onClick={() => { onDateSelect?.(ws); setPickerOpen(false) }}
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

        <button onClick={onNext} className="rounded-md p-2.5 hover:bg-muted transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronRight size={20} />
        </button>
      </div>
    )
  }

  // ─── MONTH VIEW ───
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
      <button onClick={onPrev} className="rounded-md p-2.5 hover:bg-muted transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
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
            {/* Year nav */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <button onClick={() => setPickerYear((y) => y - 1)} className="rounded-md p-1 hover:bg-muted transition-colors">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold">{pickerYear}</span>
              <button onClick={() => setPickerYear((y) => y + 1)} className="rounded-md p-1 hover:bg-muted transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-1 p-3">
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = idx === currentMonth && pickerYear === currentYear
                const isNow = idx === nowMonth && pickerYear === nowYear

                return (
                  <button
                    key={idx}
                    onClick={() => { onDateSelect?.(new Date(pickerYear, idx, 1)); setPickerOpen(false) }}
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

      <button onClick={onNext} className="rounded-md p-2.5 hover:bg-muted transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
