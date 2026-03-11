import { format, subDays, startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import type { Chore, CompletionRecord, SkippedRecord, KidStats } from '../types'
import { expandRecurrence } from './recurrence'

function makeKey(choreId: string, memberId: string, date: string) {
  return `${choreId}:${memberId}:${date}`
}

export function computeKidStats(
  memberId: string,
  chores: Chore[],
  completions: CompletionRecord,
  skipped: SkippedRecord,
  rangeStart: Date,
  rangeEnd: Date,
): KidStats {
  const kidChores = chores.filter((c) => c.assigneeId === memberId)
  let totalPoints = 0
  let completedCount = 0
  let totalCount = 0

  for (const chore of kidChores) {
    const dates = expandRecurrence(chore, rangeStart, rangeEnd)
    for (const date of dates) {
      const dateStr = format(date, 'yyyy-MM-dd')
      const key = makeKey(chore.id, memberId, dateStr)
      if (skipped[key]) continue
      totalCount++
      if (completions[key]) {
        completedCount++
        totalPoints += chore.points
      }
    }
  }

  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return {
    memberId,
    totalPoints,
    completedCount,
    totalCount,
    completionRate,
    currentStreak: computeStreak(memberId, kidChores, completions, skipped),
  }
}

function computeStreak(
  memberId: string,
  chores: Chore[],
  completions: CompletionRecord,
  skipped: SkippedRecord,
): number {
  const today = startOfDay(new Date())
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const day = subDays(today, i)
    const dayStr = format(day, 'yyyy-MM-dd')
    let hadChores = false
    let allDone = true

    for (const chore of chores) {
      const dates = expandRecurrence(chore, day, day)
      for (const d of dates) {
        if (format(d, 'yyyy-MM-dd') === dayStr) {
          const key = makeKey(chore.id, memberId, dayStr)
          if (skipped[key]) continue
          hadChores = true
          if (!completions[key]) {
            allDone = false
            break
          }
        }
      }
      if (!allDone) break
    }

    if (hadChores && allDone) {
      streak++
    } else if (hadChores && !allDone) {
      break
    }
    // Days with no chores don't break the streak
  }

  return streak
}

export function computeAllKidsStats(
  memberIds: string[],
  chores: Chore[],
  completions: CompletionRecord,
  skipped: SkippedRecord,
  rangeStart: Date,
  rangeEnd: Date,
): KidStats[] {
  return memberIds
    .map((id) => computeKidStats(id, chores, completions, skipped, rangeStart, rangeEnd))
    .sort((a, b) => b.totalPoints - a.totalPoints)
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  return { start: startOfWeek(now, { weekStartsOn: 0 }), end: endOfWeek(now, { weekStartsOn: 0 }) }
}

export function getMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  return { start: startOfMonth(now), end: endOfMonth(now) }
}
