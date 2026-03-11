export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'

export type CalendarViewMode = 'month' | 'week'

export type AppView = 'calendar' | 'dashboard'

export interface FamilyMember {
  id: string
  name: string
  color: string
  avatar?: string
}

export interface Chore {
  id: string
  name: string
  description?: string
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
}

export type CompletionRecord = Record<string, boolean>
export type SkippedRecord = Record<string, boolean>

export interface KidStats {
  memberId: string
  totalPoints: number
  completedCount: number
  totalCount: number
  completionRate: number
  currentStreak: number
}

export const MEMBER_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', dot: 'bg-green-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', dot: 'bg-pink-500' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', dot: 'bg-teal-500' },
  { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', dot: 'bg-red-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
] as const

export type MemberColor = typeof MEMBER_COLORS[number]

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
