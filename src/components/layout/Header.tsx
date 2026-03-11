import { useState, useEffect } from 'react'
import { Moon, Sun, Search, Calendar, BarChart3, Menu, Gift, Lock, KeyRound } from 'lucide-react'
import type { CalendarViewMode, AppView } from '../../types'
import { lockApp } from '../../lib/pin'
import { useAuthStore } from '../../store/auth-store'
import ChangePinDialog from '../auth/ChangePinDialog'

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
  const [changePinOpen, setChangePinOpen] = useState(false)

  const handleLock = async () => {
    await lockApp()
    useAuthStore.getState().setUnlocked(false)
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="border-b border-border px-3 xl:px-6 py-2 xl:py-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuToggle}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg xl:text-xl font-extrabold whitespace-nowrap bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Family Chores</h1>
        </div>
        <div className="flex items-center gap-1.5 xl:gap-3 flex-wrap justify-end">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => onActiveViewChange('calendar')}
              className={`rounded-md px-2 xl:px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[36px] ${
                activeView === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar size={16} />
              <span className="hidden xl:inline">Calendar</span>
            </button>
            <button
              onClick={() => onActiveViewChange('dashboard')}
              className={`rounded-md px-2 xl:px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[36px] ${
                activeView === 'dashboard'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 size={16} />
              <span className="hidden xl:inline">Dashboard</span>
            </button>
            <button
              onClick={() => onActiveViewChange('rewards')}
              className={`rounded-md px-2 xl:px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[36px] ${
                activeView === 'rewards'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Gift size={16} />
              <span className="hidden xl:inline">Rewards</span>
            </button>
          </div>

          {activeView === 'calendar' && (
            <>
              <div className="relative hidden xl:block">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search chores..."
                  className="rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring w-40 xl:w-48"
                />
              </div>
              <div className="flex gap-1 rounded-lg bg-muted p-1">
                {(['day', 'week', 'month'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onViewModeChange(mode)}
                    className={`rounded-md px-2 xl:px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                      viewMode === mode
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => setChangePinOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Change PIN"
          >
            <KeyRound size={18} />
          </button>

          <button
            onClick={() => setDark((d) => !d)}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={handleLock}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Lock app"
          >
            <Lock size={18} />
          </button>
        </div>
      </div>

      {/* Mobile search row */}
      {activeView === 'calendar' && (
        <div className="xl:hidden mt-2">
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
      <ChangePinDialog open={changePinOpen} onClose={() => setChangePinOpen(false)} />
    </header>
  )
}
