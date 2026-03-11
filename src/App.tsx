import { useState } from 'react'
import type { CalendarViewMode } from './types'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import CalendarView from './components/calendar/CalendarView'

export default function App() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')

  return (
    <div className="h-screen flex flex-col">
      <Header viewMode={viewMode} onViewModeChange={setViewMode} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <CalendarView viewMode={viewMode} />
      </div>
    </div>
  )
}
