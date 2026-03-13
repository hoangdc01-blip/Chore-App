import type { ChoreAction, RecurrenceType } from '../types'
import { useMemberStore } from '../store/member-store'

const ACTION_REGEX = /\[CREATE_CHORE\]([\s\S]*?)\[\/CREATE_CHORE\]/

const VALID_RECURRENCES: RecurrenceType[] = [
  'none', 'daily', 'weekly', 'biweekly', 'monthly', 'custom'
]

export interface ParsedChatAction {
  displayText: string
  choreAction: ChoreAction | null
}

export function parseChatResponse(rawText: string): ParsedChatAction {
  const match = rawText.match(ACTION_REGEX)

  if (!match) {
    // Strip any partial/unclosed action tags (e.g. from interrupted streams)
    const cleaned = rawText.replace(/\[CREATE_CHORE\][\s\S]*$/, '').trim()
    return { displayText: cleaned || rawText, choreAction: null }
  }

  const displayText = rawText
    .replace(ACTION_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  try {
    const parsed = JSON.parse(match[1].trim())
    const choreAction = validateChoreAction(parsed)
    return { displayText: displayText || 'Here you go!', choreAction }
  } catch {
    return { displayText: displayText || rawText, choreAction: null }
  }
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

export function getMemberNameById(id: string): string {
  const member = useMemberStore.getState().members.find(m => m.id === id)
  return member?.name ?? 'Unknown'
}
