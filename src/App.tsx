import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import type { CalendarViewMode, AppView } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import CalendarView from './components/calendar/CalendarView'
import Dashboard from './components/dashboard/Dashboard'
import RewardShop from './components/rewards/RewardShop'
import MyCoupons from './components/rewards/MyCoupons'
import GameMenu from './games/GameMenu'
import Toaster from './components/ui/Toaster'
const BuddyChat = lazy(() => import('./components/chat/BuddyChat'))
import BadgeCelebration from './components/achievements/BadgeCelebration'
import PinSetupScreen from './components/auth/PinSetupScreen'
import ProfileSelectScreen from './components/auth/ProfileSelectScreen'
const SetupWizard = lazy(() => import('./components/setup/SetupWizard'))
import { useFirebase } from './lib/firebase-flag'
import { subscribeToAll, updateMemberDoc, saveEarnedBadges, setClaimedBonus } from './lib/firestore-sync'
import { signInAfterPin } from './lib/pin'
import { useChoreStore } from './store/chore-store'
import { useMemberStore } from './store/member-store'
import { useRewardStore } from './store/reward-store'
import { useAuthStore } from './store/auth-store'
import { useAppStore } from './store/app-store'
import { useAchievementStore } from './store/achievement-store'
import { useChallengeStore } from './store/challenge-store'
import { computeKidStats, getAllTimeRange } from './lib/stats'
import { getPinHash } from './lib/pin'
import { getThemeById } from './lib/kid-themes'
import OfflineBanner from './components/layout/OfflineBanner'

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('calendar')
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(true)

  const unlocked = useAuthStore((s) => s.unlocked)
  const pinExists = useAuthStore((s) => s.pinExists)
  const mode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const members = useMemberStore((s) => s.members)
  const _initialized = useMemberStore((s) => s._initialized)

  const migrated = useRef(false)

  // Check if PIN exists and sign in anonymously (Firebase) or just check localStorage (offline)
  useEffect(() => {
    async function init() {
      const hash = await getPinHash()
      const exists = hash !== null
      useAuthStore.getState().setPinExists(exists)

      if (exists) {
        if (useFirebase) {
          // Sign in anonymously so we can load data for profile selection
          try {
            await signInAfterPin()
            useAuthStore.getState().setUnlocked(true)
          } catch {
            // Will retry when user selects profile
          }
        } else {
          // Offline mode: no auth needed, mark as unlocked for data access
          useAuthStore.getState().setUnlocked(true)
        }
      }
    }
    init()
  }, [])

  // Subscribe to Firestore data after signed in, or use localStorage data directly
  useEffect(() => {
    if (!unlocked) return

    if (!useFirebase) {
      // Offline mode: data is already in Zustand stores via localStorage persist.
      // Ensure _initialized flag is set so seeding logic works correctly.
      const currentMembers = useMemberStore.getState().members
      if (currentMembers.length > 0) {
        useMemberStore.setState({ _initialized: true })
      }
      setSyncing(false)
      return
    }

    const unsubscribe = subscribeToAll(({ members, chores, completions, skipped, pendingApprovals, rewards, redemptions, coupons, earnedBadges, claimedBonuses }) => {
      useMemberStore.setState({ members, _initialized: members.length > 0 || useMemberStore.getState()._initialized })
      useChoreStore.setState({ chores, completions, skipped, pendingApprovals })
      useRewardStore.setState({ rewards, redemptions, coupons })
      useAchievementStore.setState({ earnedBadges })
      useChallengeStore.setState({ claimedBonuses })

      // One-time migration
      if (!migrated.current) {
        migrated.current = true

        // Push localStorage achievements/challenges to Firestore if Firestore is empty
        const localBadges = useAchievementStore.getState().earnedBadges
        if (Object.keys(earnedBadges).length === 0 && Object.keys(localBadges).length > 0) {
          for (const [memberId, badges] of Object.entries(localBadges)) {
            if (badges.length > 0) saveEarnedBadges(memberId, badges)
          }
        }
        const localBonuses = useChallengeStore.getState().claimedBonuses
        if (Object.keys(claimedBonuses).length === 0 && Object.keys(localBonuses).length > 0) {
          for (const key of Object.keys(localBonuses)) {
            setClaimedBonus(key)
          }
        }

        // Compute stored points for members that don't have them yet
        const range = getAllTimeRange(chores)
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

  // When entering kid mode, ensure calendar view + reset to kid's default view
  useEffect(() => {
    if (mode === 'kid') {
      setActiveView('calendar')
    }
  }, [mode])

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
      <div className="h-dvh flex items-center justify-center bg-background">
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-3 w-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  // No PIN set yet — show setup (auto-enters parent mode after)
  if (!pinExists) {
    return <PinSetupScreen />
  }

  // Profile selection — check if setup wizard is needed first
  if (mode === 'select') {
    // If unlocked (PIN exists and auth ready), wait for sync before deciding
    if (unlocked && syncing) {
      return (
        <div className="h-dvh flex flex-col items-center justify-center bg-background text-muted-foreground gap-3">
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-3 w-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm">Loading...</span>
        </div>
      )
    }

    // No members and not initialized — show setup wizard
    if (members.length === 0 && !_initialized) {
      return (
        <>
          <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
            <SetupWizard onComplete={() => {
              useAppStore.getState().setMode('select')
            }} />
          </Suspense>
          <Toaster />
        </>
      )
    }

    return (
      <>
        <ProfileSelectScreen />
        <Toaster />
      </>
    )
  }

  // Syncing data — show loading (only after profile is selected)
  if (syncing) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-background text-muted-foreground gap-3">
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-3 w-3 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-3 w-3 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  // Apply kid theme
  const activeKidTheme = mode === 'kid' && activeKidId
    ? getThemeById(members.find((m) => m.id === activeKidId)?.theme ?? 'default')
    : null
  const themeStyle = activeKidTheme && activeKidTheme.id !== 'default'
    ? {
        '--color-primary': activeKidTheme.primaryColor,
        backgroundImage: activeKidTheme.bgGradient,
      } as React.CSSProperties
    : undefined

  // ── Main App (Parent or Kid mode) ──
  return (
    <div className="h-dvh flex flex-col" style={themeStyle}>
      <OfflineBanner />
      <Header
        activeView={activeView}
        onActiveViewChange={setActiveView}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />
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
        ) : activeView === 'games' ? (
          <GameMenu onNavigate={setActiveView} />
        ) : activeView === 'coupons' ? (
          <MyCoupons />
        ) : (
          <RewardShop />
        )}
      </div>
      <Toaster />
      <Suspense fallback={null}>
        <BuddyChat />
      </Suspense>
      <BadgeCelebration />
    </div>
  )
}
