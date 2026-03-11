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

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Header row: empty corner + day headers */}
      <div className="grid shrink-0 sticky top-0 z-10 bg-background" style={{ gridTemplateColumns: '45px repeat(7, 1fr)' }}>
        <div className="border border-border bg-muted/50" />
        {days.map((day) => {
          const today = isToday(day)
          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={`border border-border px-0.5 sm:px-2 py-1 sm:py-1.5 text-center bg-muted/50 ${today ? 'bg-primary/10' : ''}`}
            >
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
                {format(day, 'EEE')}
              </span>
              <br />
              <span
                className={`text-xs sm:text-sm font-semibold ${
                  today
                    ? 'bg-primary text-primary-foreground rounded-full inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7'
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
      <div className="grid shrink-0" style={{ gridTemplateColumns: '45px repeat(7, 1fr)' }}>
        <div className="border border-border px-0.5 sm:px-1 py-1 text-[10px] sm:text-xs text-muted-foreground font-medium flex items-start justify-end pr-1 sm:pr-2">
          All day
        </div>
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const allDay = getAllDayOccurrences(dateKey)
          return (
            <div
              key={dateKey}
              onClick={() => onDayClick(day)}
              className="border border-border p-0.5 sm:p-1 min-h-[36px] cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="space-y-0.5">
                {allDay.map((occ) => (
                  <ChoreCard
                    key={`${occ.choreId}-${occ.date}`}
                    occurrence={occ}
                    onClick={() => onChoreClick(occ)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      {HOURS.map((hour) => (
        <div key={hour} className="grid shrink-0" style={{ gridTemplateColumns: '45px repeat(7, 1fr)' }}>
          <div className="border border-border px-0.5 sm:px-1 text-[10px] sm:text-[11px] text-muted-foreground font-medium flex items-start justify-end pr-1 sm:pr-2 pt-0.5 h-[48px] sm:h-[60px]">
            {formatHour(hour)}
          </div>
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const hourOccs = getTimedOccurrences(dateKey, hour)
            return (
              <div
                key={dateKey}
                onClick={() => onDayClick(day, `${String(hour).padStart(2, '0')}:00`)}
                className="border border-border p-0.5 h-[48px] sm:h-[60px] cursor-pointer hover:bg-accent/50 transition-colors overflow-hidden"
              >
                <div className="space-y-0.5">
                  {hourOccs.map((occ) => (
                    <ChoreCard
                      key={`${occ.choreId}-${occ.date}`}
                      occurrence={occ}
                      onClick={() => onChoreClick(occ)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
