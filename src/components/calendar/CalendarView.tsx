import { useState, useMemo, useRef, useCallback } from 'react'
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, isBefore, parseISO } from 'date-fns'
import type { CalendarViewMode, ChoreOccurrence, Chore } from '../../types'
import { useChoreStore } from '../../store/chore-store'
import { useAppStore } from '../../store/app-store'
import CalendarHeader from './CalendarHeader'
import MonthView from './MonthView'
import WeekView from './WeekView'
import DayView from './DayView'
import FilterBar, { type StatusFilter } from './FilterBar'
import ChoreDialog from '../chores/ChoreDialog'
import ChoreDetails from '../chores/ChoreDetails'
import { format } from 'date-fns'

interface CalendarViewProps {
  viewMode: CalendarViewMode
  searchQuery: string
  hiddenMemberIds: Set<string>
  onToggleMember: (memberId: string) => void
}

export default function CalendarView({ viewMode, searchQuery, hiddenMemberIds, onToggleMember }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState<string | undefined>()
  const [dialogTime, setDialogTime] = useState<string | undefined>()
  const [editChore, setEditChore] = useState<Chore | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedOccurrence, setSelectedOccurrence] = useState<ChoreOccurrence | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const chores = useChoreStore((s) => s.chores)
  const completions = useChoreStore((s) => s.completions)
  const skipped = useChoreStore((s) => s.skipped)
  const pendingApprovals = useChoreStore((s) => s.pendingApprovals)
  const getOccurrencesForRange = useChoreStore((s) => s.getOccurrencesForRange)
  const appMode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)

  const occurrences = useMemo(() => {
    let start: Date, end: Date
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      start = startOfWeek(monthStart, { weekStartsOn: 0 })
      end = endOfWeek(monthEnd, { weekStartsOn: 0 })
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 })
      end = endOfWeek(currentDate, { weekStartsOn: 0 })
    } else {
      start = startOfDay(currentDate)
      end = endOfDay(currentDate)
    }
    let results = getOccurrencesForRange(start, end)
    // Kid mode: only show their own chores
    if (appMode === 'kid' && activeKidId) {
      results = results.filter((occ) => occ.chore.assigneeId === activeKidId)
    }
    if (hiddenMemberIds.size > 0) {
      results = results.filter((occ) => !hiddenMemberIds.has(occ.chore.assigneeId))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      results = results.filter((occ) => occ.chore.name.toLowerCase().includes(q))
    }
    // Status filter
    if (statusFilter === 'done') {
      results = results.filter((occ) => occ.isCompleted)
    } else if (statusFilter === 'not-done') {
      results = results.filter((occ) => !occ.isCompleted)
    } else if (statusFilter === 'overdue') {
      const today = startOfDay(new Date())
      results = results.filter((occ) => !occ.isCompleted && isBefore(startOfDay(parseISO(occ.date)), today))
    }
    return results
  }, [currentDate, viewMode, getOccurrencesForRange, searchQuery, hiddenMemberIds, chores, completions, skipped, pendingApprovals, statusFilter, appMode, activeKidId])

  // For day view date picker: compute which dates have tasks (3-month window for prev/next month nav)
  const datesWithTasks = useMemo(() => {
    if (viewMode !== 'day') return new Set<string>()
    const rangeStart = startOfWeek(startOfMonth(subMonths(currentDate, 1)), { weekStartsOn: 0 })
    const rangeEnd = endOfWeek(endOfMonth(addMonths(currentDate, 1)), { weekStartsOn: 0 })
    const allOccs = getOccurrencesForRange(rangeStart, rangeEnd)
    const dates = new Set<string>()
    for (const occ of allOccs) {
      if (hiddenMemberIds.size > 0 && hiddenMemberIds.has(occ.chore.assigneeId)) continue
      dates.add(occ.date)
    }
    return dates
  }, [viewMode, currentDate, getOccurrencesForRange, hiddenMemberIds, chores, completions, skipped])

  const handleDateSelect = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  const handlePrev = () => {
    setCurrentDate((d) => {
      if (viewMode === 'month') return subMonths(d, 1)
      if (viewMode === 'week') return subWeeks(d, 1)
      return subDays(d, 1)
    })
  }

  const handleNext = () => {
    setCurrentDate((d) => {
      if (viewMode === 'month') return addMonths(d, 1)
      if (viewMode === 'week') return addWeeks(d, 1)
      return addDays(d, 1)
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const closedAtRef = useRef(0)

  const handleDayClick = (date: Date, time?: string) => {
    if (appMode === 'kid') return // kids can't create chores
    if (Date.now() - closedAtRef.current < 300) return
    setEditChore(null)
    setDialogDate(format(date, 'yyyy-MM-dd'))
    setDialogTime(time)
    setDialogOpen(true)
  }

  const handleChoreClick = (occurrence: ChoreOccurrence) => {
    setSelectedOccurrence(occurrence)
    setDetailsOpen(true)
  }

  const handleEditFromDetails = () => {
    if (selectedOccurrence) {
      setDetailsOpen(false)
      setEditChore(selectedOccurrence.chore)
      setDialogDate(undefined)
      setDialogOpen(true)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden xl:overflow-hidden">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        datesWithTasks={datesWithTasks}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onDateSelect={handleDateSelect}
      />
      <FilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        hiddenMemberIds={hiddenMemberIds}
        onToggleMember={onToggleMember}
      />
      {viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          occurrences={occurrences}
          onDayClick={handleDayClick}
          onChoreClick={handleChoreClick}
        />
      ) : viewMode === 'week' ? (
        <WeekView
          currentDate={currentDate}
          occurrences={occurrences}
          onDayClick={handleDayClick}
          onChoreClick={handleChoreClick}
        />
      ) : (
        <DayView
          currentDate={currentDate}
          occurrences={occurrences}
          onDayClick={handleDayClick}
          onChoreClick={handleChoreClick}
        />
      )}
      <ChoreDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditChore(null); setDialogTime(undefined) }}
        defaultDate={dialogDate}
        defaultTime={dialogTime}
        editChore={editChore}
      />
      <ChoreDetails
        occurrence={selectedOccurrence}
        open={detailsOpen}
        onClose={() => { setDetailsOpen(false); closedAtRef.current = Date.now() }}
        onEdit={handleEditFromDetails}
      />
    </div>
  )
}
