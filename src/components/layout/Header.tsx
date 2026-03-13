import { Search, Calendar, BarChart3, Menu, Gift, Gamepad2, Ticket, Star } from 'lucide-react'
import type { CalendarViewMode, AppView } from '../../types'
import { useAppStore } from '../../store/app-store'
import { useMemberStore } from '../../store/member-store'

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
  const mode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const members = useMemberStore((s) => s.members)
  const isKidMode = mode === 'kid'
  const kidName = isKidMode ? members.find((m) => m.id === activeKidId)?.name : null
  const kidPoints = isKidMode ? members.find((m) => m.id === activeKidId)?.points ?? 0 : 0

  // Define nav tabs based on mode
  const navTabs: { view: AppView; icon: typeof Calendar; label: string }[] = isKidMode
    ? [
        { view: 'calendar', icon: Calendar, label: 'My Chores' },
        { view: 'rewards', icon: Gift, label: 'Rewards' },
        { view: 'coupons', icon: Ticket, label: 'Coupons' },
        { view: 'games', icon: Gamepad2, label: 'Games' },
      ]
    : [
        { view: 'calendar', icon: Calendar, label: 'Calendar' },
        { view: 'dashboard', icon: BarChart3, label: 'Dashboard' },
        { view: 'rewards', icon: Gift, label: 'Rewards' },
        { view: 'games', icon: Gamepad2, label: 'Games' },
      ]

  return (
    <header className="border-b border-border px-3 xl:px-6 py-2 xl:py-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5">
      <div className="flex items-center gap-2">
        {/* Left: menu + title */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onMenuToggle}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Menu size={20} />
          </button>
          {isKidMode ? (
            <div className="flex items-center gap-2">
              <h1 className="text-lg xl:text-xl font-extrabold whitespace-nowrap bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {kidName}'s Chores
              </h1>
              <span className="flex items-center gap-0.5 text-sm font-bold text-amber-600">
                <Star size={14} fill="currentColor" />
                {kidPoints}
              </span>
            </div>
          ) : (
            <h1 className="text-lg xl:text-xl font-extrabold whitespace-nowrap bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Family Chores</h1>
          )}
        </div>

        {/* Center: calendar-specific controls (search + view mode) */}
        {activeView === 'calendar' && (
          <div className="hidden xl:flex items-center gap-2 ml-auto">
            {!isKidMode && (
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search chores..."
                  className="rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring w-40 xl:w-48"
                />
              </div>
            )}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {(['day', 'week', 'month'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onViewModeChange(m)}
                  className={`rounded-md px-2 xl:px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                    viewMode === m
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: nav tabs — always pinned to the right */}
        <div className={`flex items-center gap-1.5 ${activeView !== 'calendar' ? 'ml-auto' : ''}`}>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {navTabs.map(({ view, icon: Icon, label }) => (
              <button
                key={view}
                onClick={() => onActiveViewChange(view)}
                className={`rounded-md px-2 xl:px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 min-h-[36px] ${
                  activeView === view
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Mobile: day/week/month toggle */}
          {activeView === 'calendar' && (
            <div className="flex xl:hidden gap-1 rounded-lg bg-muted p-1">
              {(['day', 'week', 'month'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onViewModeChange(m)}
                  className={`rounded-md px-2 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
                    viewMode === m
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile search row — parent mode only */}
      {activeView === 'calendar' && !isKidMode && (
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
    </header>
  )
}
