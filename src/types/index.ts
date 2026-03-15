export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'

export type CalendarViewMode = 'month' | 'week' | 'day'

export type AppView = 'chat' | 'calendar' | 'dashboard' | 'rewards' | 'games' | 'coupons' | 'language' | 'classes'

export interface FamilyMember {
  id: string
  name: string
  color: string
  avatar?: string
  points: number
  emojiPasscode?: string
  theme?: string
  personalityNote?: string
}

export const EMOJI_OPTIONS = ['🐶', '🐱', '🐻', '🦁', '🐸', '🦋', '🌟', '🌈', '🍎', '🎵', '🚀', '🎈']

/** Count completions for a member directly from the completions record */
export function countCompletionsForMember(completions: CompletionRecord, memberId: string): number {
  let count = 0
  for (const key of Object.keys(completions)) {
    if (completions[key] && key.split(':')[1] === memberId) count++
  }
  return count
}

export interface Chore {
  id: string
  name: string
  description?: string
  emoji?: string
  assigneeId: string
  startDate: string
  startTime?: string
  recurrence: RecurrenceType
  customDays?: number[]
  endDate?: string
  points: number
}

export interface ChoreOccurrence {
  choreId: string
  date: string
  chore: Chore
  isCompleted: boolean
  isSkipped: boolean
  isPending: boolean
}

export type CompletionRecord = Record<string, boolean>
export type SkippedRecord = Record<string, boolean>
export type PendingRecord = Record<string, boolean>

export interface KidStats {
  memberId: string
  totalPoints: number
  completedCount: number
  totalCount: number
  completionRate: number
  currentStreak: number
}

export const MEMBER_COLORS = [
  { bg: 'bg-blue-200', text: 'text-blue-900', border: 'border-blue-400', dot: 'bg-blue-500', accent: 'border-l-blue-500' },
  { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-400', dot: 'bg-green-500', accent: 'border-l-green-500' },
  { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-400', dot: 'bg-orange-500', accent: 'border-l-orange-500' },
  { bg: 'bg-purple-200', text: 'text-purple-900', border: 'border-purple-400', dot: 'bg-purple-500', accent: 'border-l-purple-500' },
  { bg: 'bg-pink-200', text: 'text-pink-900', border: 'border-pink-400', dot: 'bg-pink-500', accent: 'border-l-pink-500' },
  { bg: 'bg-teal-200', text: 'text-teal-900', border: 'border-teal-400', dot: 'bg-teal-500', accent: 'border-l-teal-500' },
  { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-400', dot: 'bg-red-500', accent: 'border-l-red-500' },
  { bg: 'bg-amber-200', text: 'text-amber-900', border: 'border-amber-400', dot: 'bg-amber-500', accent: 'border-l-amber-500' },
] as const

export type MemberColor = typeof MEMBER_COLORS[number]

export interface Reward {
  id: string
  name: string
  emoji: string
  cost: number
}

export interface Redemption {
  id: string
  rewardId: string
  memberId: string
  redeemedAt: string
}

export interface Coupon {
  id: string
  rewardId: string
  rewardName: string
  rewardEmoji: string
  memberId: string
  redeemedAt: string
  used: boolean
}

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Starter' },
  { level: 2, xp: 50, title: 'Helper' },
  { level: 3, xp: 150, title: 'Star' },
  { level: 4, xp: 300, title: 'Superstar' },
  { level: 5, xp: 500, title: 'Champion' },
  { level: 6, xp: 800, title: 'Legend' },
] as const

export function getLevel(totalPoints: number) {
  let current: { level: number; xp: number; title: string } = LEVEL_THRESHOLDS[0]
  for (const t of LEVEL_THRESHOLDS) {
    if (totalPoints >= t.xp) current = t
    else break
  }
  const nextIdx = LEVEL_THRESHOLDS.findIndex((t) => t.level === current.level) + 1
  const next = LEVEL_THRESHOLDS[nextIdx] ?? null
  return { ...current, nextXp: next?.xp ?? null }
}

export const STREAK_BADGES = [
  { days: 3, emoji: '🌟', label: '3-day streak' },
  { days: 7, emoji: '🔥', label: '7-day streak' },
  { days: 14, emoji: '💎', label: '14-day streak' },
  { days: 30, emoji: '👑', label: '30-day streak' },
] as const

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const BUDDY_CHARACTER = { name: 'Váu Váu', type: 'penguin', emoji: '\u{1F427}' } as const

/** Parsed reward-redemption request from AI chat */
export interface RewardAction {
  rewardId: string
  rewardName: string
  rewardEmoji: string
  cost: number
  memberId: string
}

export interface HomeworkCheckResult {
  subject: string
  totalProblems: number
  correct: number
  errors: Array<{
    problem: string
    kidAnswer: string
    hint: string
  }>
}

/** Parsed chore-creation request from AI chat */
export interface Sticker {
  id: string
  emoji: string
  name: string
  category: StickerCategory
  rarity: 'common' | 'rare' | 'legendary'
}

export type StickerCategory = 'animals' | 'space' | 'food' | 'sports' | 'nature'

export const STICKER_CATEGORIES: StickerCategory[] = ['animals', 'space', 'food', 'sports', 'nature']

export interface DrawingResult {
  title: string
  imageDataUrl: string  // data:image/png;base64,...
  error?: string
  style?: 'coloring' | 'illustration'
}

export interface PresentationSlide {
  title: string
  content: string  // bullet points separated by \n
  emoji?: string
}

export interface PresentationAction {
  title: string
  slideCount: number
  topics: string[]
}

export interface PresentationResult {
  title: string
  slideCount: number
  topics: string[]
  slides: PresentationSlide[]
  pptxDataUrl?: string  // generated pptx as data URL for download
  contentProgress?: { current: number; total: number }  // slide content generation progress
  imageProgress?: { current: number; total: number }  // image generation progress
}

export interface ExtraClass {
  id: string
  name: string
  description?: string
  emoji?: string
  assigneeId: string
  startDate: string        // yyyy-MM-dd
  endDate?: string         // yyyy-MM-dd
  startTime?: string       // HH:mm
  endTime?: string         // HH:mm
  recurrence: RecurrenceType
  customDays?: number[]
  location?: string
}

export interface ClassOccurrence {
  classId: string
  date: string
  classItem: ExtraClass
}

/** Parsed chore-creation request from AI chat */
export interface ChoreAction {
  name: string
  assigneeId: string
  startDate: string        // yyyy-MM-dd
  points: number
  recurrence: RecurrenceType
  emoji?: string
  startTime?: string       // HH:mm
  description?: string
  customDays?: number[]
}
