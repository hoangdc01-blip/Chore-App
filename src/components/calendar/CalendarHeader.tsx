import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarHeaderProps {
  currentDate: Date
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export default function CalendarHeader({ currentDate, onPrev, onNext, onToday }: CalendarHeaderProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <button
        onClick={onToday}
        className="rounded-md border border-border px-3 py-1 text-sm font-medium hover:bg-muted transition-colors"
      >
        Today
      </button>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="rounded-md p-1 hover:bg-muted transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onNext}
          className="rounded-md p-1 hover:bg-muted transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <h2 className="text-lg font-semibold">
        {format(currentDate, 'MMMM yyyy')}
      </h2>
    </div>
  )
}
