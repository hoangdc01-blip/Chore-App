import type { CalendarViewMode } from '../../types'

interface HeaderProps {
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
}

export default function Header({ viewMode, onViewModeChange }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <h1 className="text-xl font-semibold">Office Chores</h1>
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => onViewModeChange('month')}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            viewMode === 'month'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
            viewMode === 'week'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Week
        </button>
      </div>
    </header>
  )
}
