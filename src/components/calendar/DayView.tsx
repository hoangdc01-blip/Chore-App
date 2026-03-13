import { format, isToday } from 'date-fns'
import { Plus } from 'lucide-react'
import type { ChoreOccurrence } from '../../types'
import ChoreCard from './ChoreCard'
import { useAppStore } from '../../store/app-store'

interface DayViewProps {
  currentDate: Date
  occurrences: ChoreOccurrence[]
  onDayClick: (date: Date) => void
  onChoreClick: (occurrence: ChoreOccurrence) => void
}

export default function DayView({ currentDate, occurrences, onDayClick, onChoreClick }: DayViewProps) {
  const dateKey = format(currentDate, 'yyyy-MM-dd')
  const today = isToday(currentDate)
  const isParent = useAppStore((s) => s.mode) === 'parent'

  const dayOccurrences = occurrences.filter((occ) => occ.date === dateKey)
  const timed = dayOccurrences.filter((occ) => occ.chore.startTime).sort((a, b) => (a.chore.startTime! < b.chore.startTime! ? -1 : 1))
  const allDay = dayOccurrences.filter((occ) => !occ.chore.startTime)
  const doneCount = dayOccurrences.filter((occ) => occ.isCompleted).length

  const handleAdd = () => onDayClick(currentDate)

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Summary bar */}
      <div
        className={`flex items-center gap-2 px-4 py-2 border-b border-border ${
          today ? 'bg-primary/12' : 'bg-muted/60'
        }`}
      >
        <span className="text-sm text-muted-foreground">
          {dayOccurrences.length} {dayOccurrences.length === 1 ? 'task' : 'tasks'}
          {dayOccurrences.length > 0 && ` · ${doneCount} done`}
        </span>
        {isParent && (
          <button
            onClick={handleAdd}
            className="ml-auto flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
          >
            <Plus size={14} />
            Add chore
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {dayOccurrences.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 px-4">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-lg font-semibold">No chores {today ? 'today' : 'on this day'}</p>
            {isParent && (
              <button
                onClick={handleAdd}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                <Plus size={18} />
                Add a chore
              </button>
            )}
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
      {/* Floating add button */}
      {isParent && dayOccurrences.length > 0 && (
        <button
          onClick={handleAdd}
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
          title="Add chore"
        >
          <Plus size={22} />
        </button>
      )}
    </div>
  )
}
