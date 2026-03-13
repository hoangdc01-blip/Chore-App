import type { CompletionRecord } from '../types'
import { countCompletionsForMember } from '../types'

export interface Achievement {
  id: string
  name: string
  emoji: string
  description: string
  category: 'chores' | 'streaks' | 'games' | 'points'
  check: (ctx: AchievementContext) => boolean
}

export interface AchievementContext {
  memberId: string
  totalPoints: number
  totalCompletions: number
  currentStreak: number
  bestGameScore: number
  completionRate: number // 0-100
}

export const ACHIEVEMENTS: Achievement[] = [
  // Chores
  {
    id: 'first-steps',
    name: 'First Steps',
    emoji: '👣',
    description: 'Complete your first chore',
    category: 'chores',
    check: (ctx) => ctx.totalCompletions >= 1,
  },
  {
    id: 'helping-hand',
    name: 'Helping Hand',
    emoji: '🤝',
    description: 'Complete 10 chores',
    category: 'chores',
    check: (ctx) => ctx.totalCompletions >= 10,
  },
  {
    id: 'chore-hero',
    name: 'Chore Hero',
    emoji: '🦸',
    description: 'Complete 50 chores',
    category: 'chores',
    check: (ctx) => ctx.totalCompletions >= 50,
  },
  {
    id: 'chore-master',
    name: 'Chore Master',
    emoji: '🏅',
    description: 'Complete 100 chores',
    category: 'chores',
    check: (ctx) => ctx.totalCompletions >= 100,
  },

  // Streaks
  {
    id: 'on-fire',
    name: 'On Fire',
    emoji: '🔥',
    description: '3-day streak',
    category: 'streaks',
    check: (ctx) => ctx.currentStreak >= 3,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    emoji: '⚡',
    description: '7-day streak',
    category: 'streaks',
    check: (ctx) => ctx.currentStreak >= 7,
  },
  {
    id: 'diamond-streak',
    name: 'Diamond Streak',
    emoji: '💎',
    description: '14-day streak',
    category: 'streaks',
    check: (ctx) => ctx.currentStreak >= 14,
  },
  {
    id: 'crown',
    name: 'Crown',
    emoji: '👑',
    description: '30-day streak',
    category: 'streaks',
    check: (ctx) => ctx.currentStreak >= 30,
  },

  // Points
  {
    id: 'first-points',
    name: 'First Reward',
    emoji: '⭐',
    description: 'Earn 10 points',
    category: 'points',
    check: (ctx) => ctx.totalPoints >= 10,
  },
  {
    id: 'century',
    name: 'Century',
    emoji: '💯',
    description: 'Earn 100 points',
    category: 'points',
    check: (ctx) => ctx.totalPoints >= 100,
  },
  {
    id: 'point-legend',
    name: 'Legend',
    emoji: '🌟',
    description: 'Earn 500 points',
    category: 'points',
    check: (ctx) => ctx.totalPoints >= 500,
  },

  // Games
  {
    id: 'gamer',
    name: 'Gamer',
    emoji: '🎮',
    description: 'Score 5+ in any game',
    category: 'games',
    check: (ctx) => ctx.bestGameScore >= 5,
  },
  {
    id: 'game-master',
    name: 'Game Master',
    emoji: '🏆',
    description: 'Score 20+ in any game',
    category: 'games',
    check: (ctx) => ctx.bestGameScore >= 20,
  },
  {
    id: 'game-legend',
    name: 'Game Legend',
    emoji: '🎯',
    description: 'Score 50+ in any game',
    category: 'games',
    check: (ctx) => ctx.bestGameScore >= 50,
  },
]

export function buildAchievementContext(
  memberId: string,
  completions: CompletionRecord,
  points: number,
  streak: number,
  bestGameScore: number,
  completionRate: number,
): AchievementContext {
  return {
    memberId,
    totalPoints: points,
    totalCompletions: countCompletionsForMember(completions, memberId),
    currentStreak: streak,
    bestGameScore,
    completionRate,
  }
}

export function checkNewAchievements(
  context: AchievementContext,
  alreadyEarned: string[],
): string[] {
  const earned = new Set(alreadyEarned)
  const newlyEarned: string[] = []

  for (const achievement of ACHIEVEMENTS) {
    if (earned.has(achievement.id)) continue
    if (achievement.check(context)) {
      newlyEarned.push(achievement.id)
    }
  }

  return newlyEarned
}
