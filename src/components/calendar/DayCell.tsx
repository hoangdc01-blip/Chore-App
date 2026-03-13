import { format, isToday, isSameMonth } from 'date-fns'
import type { ChoreOccurrence } from '../../types'
import ChoreCard from './ChoreCard'

interface DayCellProps {
  day: Date
  currentMonth: Date
  occurrences: ChoreOccurrence[]
  isWeekView?: boolean
  onDayClick: (date: Date) => void
  onChoreClick: (occurrence: ChoreOccurrence) => void
}

export default function DayCell({
  day,
  currentMonth,
  occurrences,
  isWeekView = false,
  onDayClick,
  onChoreClick,
}: DayCellProps) {
  const today = isToday(day)
  const inMonth = isSameMonth(day, currentMonth)

  return (
    <div
      onClick={() => onDayClick(day)}
      className={`border border-border p-1 cursor-pointer hover:bg-accent/50 transition-colors ${
        isWeekView ? 'min-h-[200px]' : 'min-h-[100px]'
      } ${today ? 'bg-primary/12' : !inMonth && !isWeekView ? 'bg-muted/60' : ''}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span
          className={`text-sm font-semibold leading-none ${
            today
              ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center'
              : !inMonth && !isWeekView
                ? 'text-muted-foreground'
                : 'text-foreground'
          }`}
        >
          {format(day, 'd')}
        </span>
      </div>
      <div className="space-y-0.5 overflow-hidden">
        {occurrences.map((occ) => (
          <ChoreCard
            key={`${occ.choreId}-${occ.date}`}
            occurrence={occ}
            onClick={() => onChoreClick(occ)}
            compact={true}
          />
        ))}
      </div>
    </div>
  )
}
