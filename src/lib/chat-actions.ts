import type { ChoreAction, RewardAction, HomeworkCheckResult, DrawingResult, PresentationAction, RecurrenceType } from '../types'
import { useMemberStore } from '../store/member-store'
import { useRewardStore } from '../store/reward-store'

const ACTION_REGEX = /\[CREATE_CHORE\]([\s\S]*?)\[\/CREATE_CHORE\]/
const REDEEM_REGEX = /\[REDEEM_REWARD\]([\s\S]*?)\[\/REDEEM_REWARD\]/
const HOMEWORK_REGEX = /\[HOMEWORK_CHECK\]([\s\S]*?)\[\/HOMEWORK_CHECK\]/
// Format: [DRAW_IMAGE title="description"][/DRAW_IMAGE]
const DRAWING_REGEX = /\[DRAW_IMAGE\s+title="([^"]*?)"(?:\s+style="([^"]*?)")?\]\s*\[?\/DRAW_IMAGE\]?/
const PRESENTATION_REGEX = /\[GENERATE_PRESENTATION\]([\s\S]*?)\[\/GENERATE_PRESENTATION\]/

const VALID_RECURRENCES: RecurrenceType[] = [
  'none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'
]

export interface ParsedChatAction {
  displayText: string
  choreAction: ChoreAction | null
  rewardAction: RewardAction | null
  homeworkResult: HomeworkCheckResult | null
  drawingResults: DrawingResult[]
  presentationAction: PresentationAction | null
}

export function parseChatResponse(rawText: string, userMessage?: string): ParsedChatAction {
  // Strip premature action tags when user sent a generic quick-action message
  // The model should ask what to draw/present first, not generate immediately
  const GENERIC_DRAW = 'i want to draw something!'
  const GENERIC_PRESENT = 'i want to make a presentation!'
  const userLower = (userMessage ?? '').trim().toLowerCase()
  if (userLower === GENERIC_DRAW || userLower === GENERIC_PRESENT) {
    rawText = rawText
      .replace(/\[DRAW_IMAGE\s+title="[^"]*?"(?:\s+style="[^"]*?")?\]\s*\[?\/?DRAW_IMAGE\]?/g, '')
      .replace(/\[GENERATE_PRESENTATION\][\s\S]*?\[\/GENERATE_PRESENTATION\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const choreMatch = rawText.match(ACTION_REGEX)
  const rewardMatch = rawText.match(REDEEM_REGEX)
  const homeworkMatch = rawText.match(HOMEWORK_REGEX)
  const hasDrawings = DRAWING_REGEX.test(rawText)
  const presentationMatch = rawText.match(PRESENTATION_REGEX)

  if (!choreMatch && !rewardMatch && !homeworkMatch && !hasDrawings && !presentationMatch) {
    // Strip any partial/unclosed action tags (e.g. from interrupted streams)
    const cleaned = rawText
      .replace(/\[CREATE_CHORE\][\s\S]*$/, '')
      .replace(/\[REDEEM_REWARD\][\s\S]*$/, '')
      .replace(/\[HOMEWORK_CHECK\][\s\S]*$/, '')
      .replace(/\[DRAW_IMAGE[^\]]*\][\s\S]*$/, '')
      .replace(/\[GENERATE_PRESENTATION\][\s\S]*$/, '')
      .trim()
    return { displayText: cleaned || rawText, choreAction: null, rewardAction: null, homeworkResult: null, drawingResults: [], presentationAction: null }
  }

  let displayText = rawText
    .replace(ACTION_REGEX, '')
    .replace(REDEEM_REGEX, '')
    .replace(HOMEWORK_REGEX, '')
    .replace(new RegExp(DRAWING_REGEX.source, 'g'), '')
    .replace(PRESENTATION_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  let choreAction: ChoreAction | null = null
  let rewardAction: RewardAction | null = null
  let homeworkResult: HomeworkCheckResult | null = null

  if (choreMatch) {
    try {
      const parsed = JSON.parse(choreMatch[1].trim())
      choreAction = validateChoreAction(parsed)
    } catch {
      // ignore parse errors
    }
  }

  if (rewardMatch) {
    try {
      const parsed = JSON.parse(rewardMatch[1].trim())
      rewardAction = validateRewardAction(parsed)
    } catch {
      // ignore parse errors
    }
  }

  if (homeworkMatch) {
    try {
      const parsed = JSON.parse(homeworkMatch[1].trim())
      homeworkResult = validateHomeworkResult(parsed)
    } catch {
      // ignore parse errors
    }
  }

  const drawingResults: DrawingResult[] = []
  const drawingMatches = rawText.matchAll(new RegExp(DRAWING_REGEX.source, 'g'))
  for (const match of drawingMatches) {
    const title = match[1]?.trim()
    if (title) {
      const style = (match[2]?.trim() === 'illustration') ? 'illustration' : 'coloring'
      drawingResults.push({ title, imageDataUrl: '', style })
    }
  }

  let presentationAction: PresentationAction | null = null
  if (presentationMatch) {
    try {
      const parsed = JSON.parse(presentationMatch[1].trim())
      presentationAction = validatePresentationAction(parsed)
    } catch {
      // ignore parse errors
    }
  }

  return { displayText: displayText || 'Here you go!', choreAction, rewardAction, homeworkResult, drawingResults, presentationAction }
}

function validateChoreAction(data: unknown): ChoreAction | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  // Required: name
  if (typeof obj.name !== 'string' || !obj.name.trim()) return null

  // Required: assigneeId — try ID first, then name matching
  const members = useMemberStore.getState().members
  let assigneeId = String(obj.assigneeId ?? '')

  if (!members.some(m => m.id === assigneeId)) {
    const nameStr = String(obj.assigneeName ?? obj.assignee ?? obj.name ?? '').toLowerCase()
    const byName = members.find(m => m.name.toLowerCase() === nameStr)
    if (byName) {
      assigneeId = byName.id
    } else if (members.length > 0) {
      // Last resort: don't fail, but we can't guess — return null
      return null
    } else {
      return null
    }
  }

  // Required: startDate (yyyy-MM-dd)
  const startDate = String(obj.startDate ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null

  const points = Math.max(1, Number(obj.points) || 1)

  const recurrence: RecurrenceType = VALID_RECURRENCES.includes(obj.recurrence as RecurrenceType)
    ? (obj.recurrence as RecurrenceType)
    : 'none'

  const emoji = typeof obj.emoji === 'string' && obj.emoji ? obj.emoji : undefined
  const startTime = typeof obj.startTime === 'string' && /^\d{2}:\d{2}$/.test(obj.startTime)
    ? obj.startTime : undefined
  const description = typeof obj.description === 'string' && obj.description.trim()
    ? obj.description.trim() : undefined
  const customDays = Array.isArray(obj.customDays)
    ? obj.customDays.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6)
    : undefined

  return {
    name: (obj.name as string).trim(),
    assigneeId,
    startDate,
    points,
    recurrence,
    emoji,
    startTime,
    description,
    customDays: recurrence === 'custom' ? customDays : undefined,
  }
}

function validateRewardAction(data: unknown): RewardAction | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  // Required: rewardId — must exist in reward store
  const rewardId = String(obj.rewardId ?? '')
  const { rewards } = useRewardStore.getState()
  const reward = rewards.find(r => r.id === rewardId)
  if (!reward) return null

  // Required: memberId — must exist in member store
  const memberId = String(obj.memberId ?? '')
  const members = useMemberStore.getState().members
  const member = members.find(m => m.id === memberId)
  if (!member) return null

  // Check member has enough points
  if ((member.points ?? 0) < reward.cost) return null

  return {
    rewardId: reward.id,
    rewardName: reward.name,
    rewardEmoji: reward.emoji,
    cost: reward.cost,
    memberId: member.id,
  }
}

function validateHomeworkResult(data: unknown): HomeworkCheckResult | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  const subject = String(obj.subject ?? '')
  const validSubjects = ['math', 'reading', 'writing', 'science', 'vietnamese', 'chinese']
  if (!validSubjects.includes(subject)) return null

  const totalProblems = Number(obj.totalProblems)
  if (!Number.isFinite(totalProblems) || totalProblems < 1) return null

  const correct = Number(obj.correct)
  if (!Number.isFinite(correct) || correct < 0 || correct > totalProblems) return null

  const errors: HomeworkCheckResult['errors'] = []
  if (Array.isArray(obj.errors)) {
    for (const err of obj.errors) {
      if (!err || typeof err !== 'object') continue
      const e = err as Record<string, unknown>
      const problem = String(e.problem ?? '').trim()
      const kidAnswer = String(e.kidAnswer ?? '').trim()
      const hint = String(e.hint ?? '').trim()
      if (problem && kidAnswer && hint) {
        errors.push({ problem, kidAnswer, hint })
      }
    }
  }

  return { subject, totalProblems, correct, errors }
}

function validatePresentationAction(data: unknown): PresentationAction | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  const title = typeof obj.title === 'string' ? obj.title.trim() : ''
  if (!title) return null

  if (!Array.isArray(obj.topics) || obj.topics.length === 0) return null

  // Cap at 50 topics maximum, filter to valid strings
  const topics: string[] = obj.topics
    .slice(0, 50)
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t: string) => t.trim())

  if (topics.length === 0) return null

  const slideCount = typeof obj.slideCount === 'number' && obj.slideCount > 0
    ? Math.min(obj.slideCount, 50)
    : topics.length

  return { title, slideCount, topics }
}

export function getMemberNameById(id: string): string {
  const member = useMemberStore.getState().members.find(m => m.id === id)
  return member?.name ?? 'Unknown'
}
