import { format } from 'date-fns'
import { getMonthDays } from '../../lib/calendar'
import type { ChoreOccurrence } from '../../types'
import DayCell from './DayCell'

const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAYS_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface MonthViewProps {
  currentDate: Date
  occurrences: ChoreOccurrence[]
  onDayClick: (date: Date) => void
  onChoreClick: (occurrence: ChoreOccurrence) => void
}

export default function MonthView({ currentDate, occurrences, onDayClick, onChoreClick }: MonthViewProps) {
  const days = getMonthDays(currentDate)

  const occurrencesByDate = new Map<string, ChoreOccurrence[]>()
  for (const occ of occurrences) {
    const existing = occurrencesByDate.get(occ.date) ?? []
    existing.push(occ)
    occurrencesByDate.set(occ.date, existing)
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="grid grid-cols-7">
        {WEEKDAYS_LONG.map((day, i) => (
          <div
            key={day}
            className="border border-border px-1 sm:px-2 py-1 sm:py-1.5 text-xs font-semibold text-muted-foreground text-center bg-muted/50"
          >
            <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
            <span className="hidden sm:inline">{day}</span>
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
  )
}
