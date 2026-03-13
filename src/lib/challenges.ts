import { format } from 'date-fns'
import type { CompletionRecord } from '../types'

export interface Challenge {
  id: string
  type: 'daily' | 'weekly'
  title: string
  emoji: string
  description: string
  target: number
  bonusPoints: number
  getProgress: (ctx: ChallengeContext) => number
}

export interface ChallengeContext {
  memberId: string
  completions: CompletionRecord
  todayStr: string
}

const DAILY_CHALLENGES: Challenge[] = [
  {
    id: 'complete-1',
    type: 'daily',
    title: 'Get Started',
    emoji: '🌅',
    description: 'Complete 1 chore today',
    target: 1,
    bonusPoints: 2,
    getProgress: (ctx) => countCompletionsToday(ctx),
  },
  {
    id: 'complete-3',
    type: 'daily',
    title: 'Triple Threat',
    emoji: '⚡',
    description: 'Complete 3 chores today',
    target: 3,
    bonusPoints: 5,
    getProgress: (ctx) => countCompletionsToday(ctx),
  },
  {
    id: 'complete-5',
    type: 'daily',
    title: 'Super Star',
    emoji: '🌟',
    description: 'Complete 5 chores today',
    target: 5,
    bonusPoints: 10,
    getProgress: (ctx) => countCompletionsToday(ctx),
  },
]

function countCompletionsToday(ctx: ChallengeContext): number {
  let count = 0
  for (const key of Object.keys(ctx.completions)) {
    if (ctx.completions[key] && key.includes(`:${ctx.memberId}:${ctx.todayStr}`)) {
      count++
    }
  }
  return count
}

/** Deterministic daily challenge based on date string as seed */
export function getDailyChallenge(dateStr: string): Challenge {
  // Simple hash of date string
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash) + dateStr.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % DAILY_CHALLENGES.length
  return DAILY_CHALLENGES[index]
}

export function getTodayChallenge(): Challenge {
  return getDailyChallenge(format(new Date(), 'yyyy-MM-dd'))
}
