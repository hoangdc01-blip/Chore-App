import { useState, useEffect } from 'react'
import type { CalendarViewMode, AppView } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import CalendarView from './components/calendar/CalendarView'
import Dashboard from './components/dashboard/Dashboard'
import { fetchAllData } from './lib/firestore-sync'
import { useChoreStore } from './store/chore-store'
import { useMemberStore } from './store/member-store'

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('calendar')
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(true)

  useEffect(() => {
    fetchAllData()
      .then(({ members, chores, completions, skipped }) => {
        if (members.length > 0 || chores.length > 0) {
          useMemberStore.setState({ members, _initialized: true })
          useChoreStore.setState({ chores, completions, skipped })
        }
      })
      .catch((err) => {
        console.warn('Firestore sync failed, using local data:', err)
      })
      .finally(() => setSyncing(false))
  }, [])

  const toggleMemberFilter = (memberId: string) => {
    setHiddenMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
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
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Syncing data...
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
            <CalendarView viewMode={viewMode} searchQuery={searchQuery} hiddenMemberIds={hiddenMemberIds} />
          ) : (
            <Dashboard />
          )}
        </div>
      )}
    </div>
  )
}
