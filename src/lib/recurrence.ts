import { addDays, addWeeks, addMonths, isBefore, isAfter, parseISO, startOfDay } from 'date-fns'
import type { Chore } from '../types'

type IncrementFn = (d: Date) => Date

const incrementMap: Record<string, IncrementFn | null> = {
  none: null,
  daily: (d) => addDays(d, 1),
  weekly: (d) => addWeeks(d, 1),
  biweekly: (d) => addWeeks(d, 2),
  monthly: (d) => addMonths(d, 1),
}

export function expandRecurrence(chore: Chore, rangeStart: Date, rangeEnd: Date): Date[] {
  const start = startOfDay(parseISO(chore.startDate))
  const rStart = startOfDay(rangeStart)
  const rEnd = startOfDay(rangeEnd)
  const effectiveEnd = chore.endDate ? startOfDay(parseISO(chore.endDate)) : rEnd

  const increment = incrementMap[chore.recurrence]

  if (!increment) {
    if (!isBefore(start, rStart) && !isAfter(start, rEnd)) {
      return [start]
    }
    return []
  }

  const dates: Date[] = []
  let current = start

  while (isBefore(current, rStart)) {
    current = increment(current)
  }

  while (!isAfter(current, rEnd) && !isAfter(current, effectiveEnd)) {
    dates.push(current)
    current = increment(current)
  }

  return dates
}
