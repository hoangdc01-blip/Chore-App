import { useState, useEffect } from 'react'
import { Moon, Sun, Search, Calendar, BarChart3, Menu } from 'lucide-react'
import type { CalendarViewMode, AppView } from '../../types'

interface HeaderProps {
  activeView: AppView
  onActiveViewChange: (view: AppView) => void
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onMenuToggle: () => void
}

export default function Header({ activeView, onActiveViewChange, viewMode, onViewModeChange, searchQuery, onSearchChange, onMenuToggle }: HeaderProps) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="border-b border-border px-3 sm:px-6 py-2 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="md:hidden rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold whitespace-nowrap">Family Chores</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-end">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => onActiveViewChange('calendar')}
              className={`rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[36px] ${
                activeView === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => onActiveViewChange('dashboard')}
              className={`rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[36px] ${
                activeView === 'dashboard'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>

          {activeView === 'calendar' && (
            <>
              <div className="relative hidden sm:block">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search chores..."
                  className="rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring w-40 lg:w-48"
                />
              </div>
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => onViewModeChange('month')}
                  className={`rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                    viewMode === 'month'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => onViewModeChange('week')}
                  className={`rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                    viewMode === 'week'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Week
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setDark((d) => !d)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile search row */}
      {activeView === 'calendar' && (
        <div className="sm:hidden mt-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chores..."
              className="rounded-md border border-border bg-background pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring w-full"
            />
          </div>
        </div>
      )}
    </header>
  )
}
