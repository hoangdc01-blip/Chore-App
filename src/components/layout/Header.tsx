import { Search, Menu, Star } from 'lucide-react'
import type { CalendarViewMode, AppView } from '../../types'
import { useAppStore } from '../../store/app-store'
import { useMemberStore } from '../../store/member-store'
import Input from '../ui/Input'

interface HeaderProps {
  activeView: AppView
  onActiveViewChange: (view: AppView) => void
  viewMode: CalendarViewMode
  onViewModeChange: (mode: CalendarViewMode) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onMenuToggle: () => void
}

const VIEW_TITLES: Partial<Record<AppView, string>> = {
  chat: '',
  calendar: 'Calendar',
  classes: 'Extra Classes',
  dashboard: 'Dashboard',
  rewards: 'Rewards',
  games: 'Games',
  coupons: 'Coupons',
  language: 'Learn',
  music: 'Music',
  members: 'Manage Family',
}

export default function Header({ activeView, onActiveViewChange: _onActiveViewChange, viewMode, onViewModeChange, searchQuery, onSearchChange, onMenuToggle }: HeaderProps) {
  const mode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const members = useMemberStore((s) => s.members)
  const isKidMode = mode === 'kid'
  // kidName available for future use: members.find((m) => m.id === activeKidId)?.name
  const kidPoints = isKidMode ? members.find((m) => m.id === activeKidId)?.points ?? 0 : 0

  const viewTitle = VIEW_TITLES[activeView] || ''

  return (
    <header className="safe-top border-b border-border/50 px-3 xl:px-6 py-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5">
      <div className="flex items-center gap-2" role="navigation" aria-label="Main navigation">
        {/* Left: hamburger + branding */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onMenuToggle}
            aria-label="Toggle menu"
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Menu size={20} />
          </button>
          {isKidMode ? (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold whitespace-nowrap bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Váu Váu
              </h1>
              <span className="flex items-center gap-0.5 text-sm font-bold text-amber-600">
                <Star size={14} fill="currentColor" />
                {kidPoints}
              </span>
            </div>
          ) : (
            <h1 className="text-lg font-extrabold whitespace-nowrap bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Váu Váu
            </h1>
          )}
        </div>

        {/* Center: view title */}
        {viewTitle && (
          <span className="text-sm font-semibold text-muted-foreground ml-1">
            {viewTitle}
          </span>
        )}

        {/* Right: calendar-specific controls */}
        {activeView === 'calendar' && (
          <div className="flex items-center gap-2 ml-auto">
            {!isKidMode && (
              <div className="relative hidden xl:block">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search chores..."
                  className="pl-8 pr-3 py-1.5 w-40 xl:w-48"
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

        {/* Spacer when not calendar view */}
        {activeView !== 'calendar' && <div className="ml-auto" />}
      </div>

      {/* Mobile search row — calendar + parent mode only */}
      {activeView === 'calendar' && !isKidMode && (
        <div className="xl:hidden mt-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search chores..."
              className="pl-8 pr-3 py-2"
            />
          </div>
        </div>
      )}
    </header>
  )
}
