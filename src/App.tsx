import { useState, useEffect, useRef } from 'react'
import type { CalendarViewMode, AppView } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import CalendarView from './components/calendar/CalendarView'
import Dashboard from './components/dashboard/Dashboard'
import RewardShop from './components/rewards/RewardShop'
import Toaster from './components/ui/Toaster'
import PinLockScreen from './components/auth/PinLockScreen'
import PinSetupScreen from './components/auth/PinSetupScreen'
import { subscribeToAll, updateMemberDoc } from './lib/firestore-sync'
import { useChoreStore } from './store/chore-store'
import { useMemberStore } from './store/member-store'
import { useRewardStore } from './store/reward-store'
import { useAuthStore } from './store/auth-store'
import { computeKidStats, getAllTimeRange } from './lib/stats'
import { getPinHash } from './lib/pin'

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('calendar')
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(true)

  const unlocked = useAuthStore((s) => s.unlocked)
  const pinExists = useAuthStore((s) => s.pinExists)

  const migrated = useRef(false)

  // Check if PIN exists on mount
  useEffect(() => {
    getPinHash().then((hash) => {
      useAuthStore.getState().setPinExists(hash !== null)
    })
  }, [])

  // Only subscribe to Firestore data after unlocked
  useEffect(() => {
    if (!unlocked) return
    const unsubscribe = subscribeToAll(({ members, chores, completions, skipped, rewards, redemptions }) => {
      useMemberStore.setState({ members, _initialized: true })
      useChoreStore.setState({ chores, completions, skipped })
      useRewardStore.setState({ rewards, redemptions })

      // One-time migration: compute stored points for members that don't have them yet
      if (!migrated.current) {
        migrated.current = true
        const range = getAllTimeRange()
        const rewardMap = new Map(rewards.map((r) => [r.id, r]))

        for (const member of members) {
          if (member.points === undefined || member.points === null) {
            const stats = computeKidStats(member.id, chores, completions, skipped, range.start, range.end)
            const spent = redemptions
              .filter((r) => r.memberId === member.id)
              .reduce((sum, r) => sum + (Number(rewardMap.get(r.rewardId)?.cost) || 0), 0)
            updateMemberDoc(member.id, { points: Math.max(0, stats.totalPoints - spent) })
          }
        }
      }

      setSyncing(false)
    })
    return unsubscribe
  }, [unlocked])

  const toggleMemberFilter = (memberId: string) => {
    setHiddenMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  // Loading: checking if PIN exists
  if (pinExists === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-3 w-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  // No PIN set yet — show setup
  if (!pinExists) {
    return <PinSetupScreen />
  }

  // PIN exists but not unlocked — show lock screen
  if (!unlocked) {
    return <PinLockScreen />
  }

  return (
    <div className="h-screen flex flex-col">
      <Header
        activeView={activeView}
        onActiveViewChange={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />
      {syncing ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-3 w-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">Loading...</span>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            hiddenMemberIds={hiddenMemberIds}
            onToggleMember={toggleMemberFilter}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          {activeView === 'calendar' ? (
            <CalendarView viewMode={viewMode} searchQuery={searchQuery} hiddenMemberIds={hiddenMemberIds} onToggleMember={toggleMemberFilter} />
          ) : activeView === 'dashboard' ? (
            <Dashboard />
          ) : (
            <RewardShop />
          )}
        </div>
      )}
      <Toaster />
    </div>
  )
}
