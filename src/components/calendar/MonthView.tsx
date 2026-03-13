import { useState, useEffect } from 'react'
import { format, isToday, isSameMonth, isSameDay } from 'date-fns'
import { getMonthDays } from '../../lib/calendar'
import type { ChoreOccurrence } from '../../types'
import DayCell from './DayCell'
import ChoreCard from './ChoreCard'

const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface MonthViewProps {
  currentDate: Date
  occurrences: ChoreOccurrence[]
  onDayClick: (date: Date) => void
  onChoreClick: (occurrence: ChoreOccurrence) => void
}

export default function MonthView({ currentDate, occurrences, onDayClick, onChoreClick }: MonthViewProps) {
  const days = getMonthDays(currentDate)
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const today = days.find((d) => isToday(d))
    return today ?? days.find((d) => isSameMonth(d, currentDate)) ?? days[0]
  })

  // When "Today" is pressed or month changes, auto-select today (if visible) or first of month
  useEffect(() => {
    const today = days.find((d) => isToday(d))
    if (today) {
      setSelectedDay(today)
    } else {
      const firstOfMonth = days.find((d) => isSameMonth(d, currentDate))
      if (firstOfMonth) setSelectedDay(firstOfMonth)
    }
  }, [currentDate])

  const occurrencesByDate = new Map<string, ChoreOccurrence[]>()
  for (const occ of occurrences) {
    const existing = occurrencesByDate.get(occ.date) ?? []
    existing.push(occ)
    occurrencesByDate.set(occ.date, existing)
  }

  const selectedDateKey = format(selectedDay, 'yyyy-MM-dd')
  const selectedDayOccurrences = occurrencesByDate.get(selectedDateKey) ?? []

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Desktop: traditional grid ── */}
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
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            return (
              <DayCell
                key={dateKey}
                day={day}
                currentMonth={currentDate}
                occurrences={occurrencesByDate.get(dateKey) ?? []}
                onDayClick={onDayClick}
                onChoreClick={onChoreClick}
              />
            )
          })}
        </div>
      </div>

      {/* ── Mobile: compact mini calendar + selected day tasks ── */}
      <div className="flex-1 flex flex-col overflow-hidden xl:hidden">
        {/* Mini calendar grid */}
        <div className="shrink-0 px-2 pt-2 pb-1">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS_SHORT.map((day, i) => (
              <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd')
              const inMonth = isSameMonth(day, currentDate)
              const today = isToday(day)
              const isSelected = isSameDay(day, selectedDay)
              const dayOccs = occurrencesByDate.get(dateKey) ?? []
              const hasTasks = dayOccs.length > 0
              const allDone = hasTasks && dayOccs.every((o) => o.isCompleted)

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
                  {/* Dot indicator */}
                  {hasTasks ? (
                    <span className={`h-1.5 w-1.5 rounded-full mt-0.5 ${allDone ? 'bg-green-500' : 'bg-primary'}`} />
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
            {selectedDayOccurrences.length} {selectedDayOccurrences.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Selected day's tasks */}
        <div className="flex-1 overflow-y-auto">
          {selectedDayOccurrences.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-4">
              <p className="text-3xl mb-2">📅</p>
              <p className="font-semibold">No chores on this day</p>
              <button
                onClick={() => onDayClick(selectedDay)}
                className="text-sm text-primary mt-2 hover:underline"
              >
                Tap to add one
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {selectedDayOccurrences.map((occ) => (
                <ChoreCard
                  key={`${occ.choreId}-${occ.date}`}
                  occurrence={occ}
                  onClick={() => onChoreClick(occ)}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
