import { useState, useMemo } from 'react'
import { addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import type { CalendarViewMode, ChoreOccurrence, Chore } from '../../types'
import { useChoreStore } from '../../store/chore-store'
import CalendarHeader from './CalendarHeader'
import MonthView from './MonthView'
import WeekView from './WeekView'
import ChoreDialog from '../chores/ChoreDialog'
import ChoreDetails from '../chores/ChoreDetails'
import { format } from 'date-fns'

interface CalendarViewProps {
  viewMode: CalendarViewMode
}

export default function CalendarView({ viewMode }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState<string | undefined>()
  const [dialogTime, setDialogTime] = useState<string | undefined>()
  const [editChore, setEditChore] = useState<Chore | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedOccurrence, setSelectedOccurrence] = useState<ChoreOccurrence | null>(null)

  const getOccurrencesForRange = useChoreStore((s) => s.getOccurrencesForRange)

  const occurrences = useMemo(() => {
    let start: Date, end: Date
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      start = startOfWeek(monthStart, { weekStartsOn: 0 })
      end = endOfWeek(monthEnd, { weekStartsOn: 0 })
    } else {
      start = startOfWeek(currentDate, { weekStartsOn: 0 })
      end = endOfWeek(currentDate, { weekStartsOn: 0 })
    }
    return getOccurrencesForRange(start, end)
  }, [currentDate, viewMode, getOccurrencesForRange])

  const handlePrev = () => {
    setCurrentDate((d) => (viewMode === 'month' ? subMonths(d, 1) : subWeeks(d, 1)))
  }

  const handleNext = () => {
    setCurrentDate((d) => (viewMode === 'month' ? addMonths(d, 1) : addWeeks(d, 1)))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (date: Date, time?: string) => {
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
    <div className="flex-1 flex flex-col overflow-hidden">
      <CalendarHeader
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />
      {viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          occurrences={occurrences}
          onDayClick={handleDayClick}
          onChoreClick={handleChoreClick}
        />
      ) : (
        <WeekView
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
        onClose={() => setDetailsOpen(false)}
        onEdit={handleEditFromDetails}
      />
    </div>
  )
}
