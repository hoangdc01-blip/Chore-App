import { useState, useEffect } from 'react'
import { format, isToday } from 'date-fns'
import { getWeekDays } from '../../lib/calendar'
import type { ChoreOccurrence } from '../../types'
import ChoreCard from './ChoreCard'

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5)

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

function getHourFromTime(time: string): number {
  const [h] = time.split(':').map(Number)
  return h
}

interface WeekViewProps {
  currentDate: Date
  occurrences: ChoreOccurrence[]
  onDayClick: (date: Date, time?: string) => void
  onChoreClick: (occurrence: ChoreOccurrence) => void
}

export default function WeekView({ currentDate, occurrences, onDayClick, onChoreClick }: WeekViewProps) {
  const days = getWeekDays(currentDate)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const todayIdx = days.findIndex((d) => isToday(d))
    return todayIdx >= 0 ? todayIdx : 0
  })

  // When "Today" is pressed or week changes, auto-select today (if in this week) or first day
  useEffect(() => {
    const todayIdx = days.findIndex((d) => isToday(d))
    setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0)
  }, [currentDate])

  const occurrencesByDate = new Map<string, ChoreOccurrence[]>()
  for (const occ of occurrences) {
    const existing = occurrencesByDate.get(occ.date) ?? []
    existing.push(occ)
    occurrencesByDate.set(occ.date, existing)
  }

  function getTimedOccurrences(dateKey: string, hour: number) {
    return (occurrencesByDate.get(dateKey) ?? []).filter(
      (occ) => occ.chore.startTime && getHourFromTime(occ.chore.startTime) === hour
    )
  }

  function getAllDayOccurrences(dateKey: string) {
    return (occurrencesByDate.get(dateKey) ?? []).filter((occ) => !occ.chore.startTime)
  }

  const selectedDay = days[selectedDayIndex]
  const selectedDateKey = format(selectedDay, 'yyyy-MM-dd')
  const selectedDayOccurrences = occurrencesByDate.get(selectedDateKey) ?? []

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ── Desktop: timeline grid ── */}
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
                onClick={() => onDayClick(day)}
                className={`border border-border p-1 min-h-[36px] cursor-pointer hover:bg-accent/50 transition-colors ${todayCol ? 'bg-primary/12' : ''}`}
              >
                <div className="space-y-0.5">
                  {allDay.map((occ) => (
                    <ChoreCard key={`${occ.choreId}-${occ.date}`} occurrence={occ} onClick={() => onChoreClick(occ)} compact={true} />
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
                  onClick={() => onDayClick(day, `${String(hour).padStart(2, '0')}:00`)}
                  className={`border border-border p-0.5 h-[60px] cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden ${todayCol ? 'bg-primary/12' : ''}`}
                >
                  <div className="space-y-0.5">
                    {hourOccs.map((occ) => (
                      <ChoreCard key={`${occ.choreId}-${occ.date}`} occurrence={occ} onClick={() => onChoreClick(occ)} compact={true} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Mobile: horizontal day selector + task list ── */}
      <div className="flex-1 flex flex-col overflow-hidden xl:hidden">
        {/* Day selector row */}
        <div className="flex shrink-0 border-b border-border bg-muted">
          {days.map((day, idx) => {
            const today = isToday(day)
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayOccs = occurrencesByDate.get(dateKey) ?? []
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
                {/* Dot badges for days with tasks */}
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

        {/* Selected day's tasks */}
        <div className="flex-1 overflow-y-auto">
          {selectedDayOccurrences.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-4">
              <p className="text-3xl mb-2">📋</p>
              <p className="font-semibold">No chores on {format(selectedDay, 'EEEE')}</p>
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
