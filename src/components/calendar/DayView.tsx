import { format, isToday } from 'date-fns'
import type { ChoreOccurrence } from '../../types'
import ChoreCard from './ChoreCard'

interface DayViewProps {
  currentDate: Date
  occurrences: ChoreOccurrence[]
  onDayClick: (date: Date) => void
  onChoreClick: (occurrence: ChoreOccurrence) => void
}

export default function DayView({ currentDate, occurrences, onDayClick, onChoreClick }: DayViewProps) {
  const dateKey = format(currentDate, 'yyyy-MM-dd')
  const today = isToday(currentDate)

  const dayOccurrences = occurrences.filter((occ) => occ.date === dateKey)
  const timed = dayOccurrences.filter((occ) => occ.chore.startTime).sort((a, b) => (a.chore.startTime! < b.chore.startTime! ? -1 : 1))
  const allDay = dayOccurrences.filter((occ) => !occ.chore.startTime)
  const doneCount = dayOccurrences.filter((occ) => occ.isCompleted).length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Summary bar */}
      <div
        onClick={() => onDayClick(currentDate)}
        className={`flex items-center gap-2 px-4 py-2 border-b border-border cursor-pointer ${
          today ? 'bg-primary/5' : 'bg-muted/30'
        }`}
      >
        <span className="text-sm text-muted-foreground">
          {dayOccurrences.length} {dayOccurrences.length === 1 ? 'task' : 'tasks'}
          {dayOccurrences.length > 0 && ` · ${doneCount} done`}
        </span>
        <span className="ml-auto text-xs text-primary hover:underline">+ Add chore</span>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {dayOccurrences.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 px-4">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-lg font-semibold">No chores {today ? 'today' : 'on this day'}</p>
            <p className="text-sm mt-1">Tap "+ Add chore" to create one</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {/* All-day tasks */}
            {allDay.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">All Day</p>
                <div className="space-y-2">
                  {allDay.map((occ) => (
                    <ChoreCard
                      key={`${occ.choreId}-${occ.date}`}
                      occurrence={occ}
                      onClick={() => onChoreClick(occ)}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timed tasks */}
            {timed.length > 0 && (
              <div>
                {allDay.length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1 mt-3">Scheduled</p>
                )}
                <div className="space-y-2">
                  {timed.map((occ) => (
                    <ChoreCard
                      key={`${occ.choreId}-${occ.date}`}
                      occurrence={occ}
                      onClick={() => onChoreClick(occ)}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
