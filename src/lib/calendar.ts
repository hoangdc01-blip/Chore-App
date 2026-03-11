import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns'

export function getMonthDays(date: Date): Date[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
}

export function getWeekDays(date: Date): Date[] {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: weekStart, end: weekEnd })
}
