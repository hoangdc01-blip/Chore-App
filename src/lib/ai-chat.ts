import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import { getEnv } from './env'
import { useMemberStore } from '../store/member-store'
import { useChoreStore } from '../store/chore-store'
import { useRewardStore } from '../store/reward-store'
import { computeKidStats, computeStreak } from './stats'
import { getLevel } from '../types'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Base64 data URL of an attached image (e.g. "data:image/jpeg;base64,...") */
  image?: string
}

// Configurable via environment variables
const TEXT_MODEL = getEnv('VITE_OLLAMA_TEXT_MODEL', 'qwen2.5:7b')
const VISION_MODEL = getEnv('VITE_OLLAMA_VISION_MODEL', 'llava:7b')
const OLLAMA_BASE = getEnv('VITE_OLLAMA_URL', 'http://localhost:11434')

/** Resize an image file to fit within maxDim and return a base64 data URL */
export function resizeImageToDataURL(file: File, maxDim = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

// Compact system prompt — optimized for small models (fewer tokens, same rules)
const BASE_SYSTEM_PROMPT = `You are Buddy, a fun AI assistant for kids aged 4-6 in a chore app. Use simple short sentences, lots of emoji. Be encouraging and positive. Max 3-4 sentences per response.

LANGUAGE RULE (MOST IMPORTANT): Reply in the SAME language the user writes. Never mix languages. Check [LANGUAGE HINT] if unsure.

POINTS: Kids EARN points as rewards AFTER completing chores. Say "You'll earn X points!" Never say "you need points to do this."

CHORE STATUS:
- DONE = completed and approved
- PENDING APPROVAL = submitted, waiting for parent to check. Say "Waiting for mom/dad to check! ⏳"
- NOT DONE = encourage the kid to do it

HOMEWORK HELP (math, science, Chinese only):
- Give the DIRECT answer first, then a short fun explanation
- Math: "2+192=194! 🎉" Never count one by one
- Science: simple kid-friendly facts with fun comparisons
- Chinese: character + pinyin + meaning, 1-2 chars max

MOTIVATION: Proactively encourage kids about pending chores. Mention streaks. If most chores are done, celebrate! If it's late and chores remain, gently remind.

PROGRESS: When asked about progress, use WEEKLY PROGRESS data. Be encouraging. Celebrate streaks.

REWARDS: When kids ask about rewards, tell them what they can afford and encourage saving.

You help with: 1) Daily chores 2) Fun facts 3) Homework (math/science/Chinese)
Never discuss anything inappropriate or scary. Be kind, patient, fun.`

const CHORE_CREATION_PROMPT = `

CHORE CREATION: When the user asks to add, create, or schedule a chore, output EXACTLY this block at the END of your response:

[CREATE_CHORE]{"name":"chore name","assigneeId":"member-id","startDate":"YYYY-MM-DD","points":1,"recurrence":"none"}[/CREATE_CHORE]

Rules for chore creation:
- name: short descriptive name for the chore
- assigneeId: MUST be an exact ID from the FAMILY MEMBERS list below
- startDate: resolve relative dates (tomorrow, next Monday, etc.) using the current date. Format: YYYY-MM-DD
- points: number, default 1 if not specified
- recurrence: one of "none","daily","weekly","biweekly","monthly". Default "none"
- Optional fields: "emoji" (single emoji), "startTime" (HH:mm format), "description" (short text)
- If the user doesn't specify who the chore is for, use the Current kid's ID
- Always write a short fun message BEFORE the [CREATE_CHORE] block
- NEVER put anything after the [/CREATE_CHORE] tag
- Output the JSON on a SINGLE LINE, no line breaks inside the JSON`

function buildProgressContext(memberId: string): string {
  const { chores, completions, skipped } = useChoreStore.getState()
  const member = useMemberStore.getState().members.find(m => m.id === memberId)
  if (!member) return ''

  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 })
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 })

  const thisWeek = computeKidStats(memberId, chores, completions, skipped, thisWeekStart, thisWeekEnd)
  const lastWeek = computeKidStats(memberId, chores, completions, skipped, lastWeekStart, lastWeekEnd)
  const level = getLevel(member.points)

  return `\n\nWEEKLY PROGRESS:
  This week: ${thisWeek.completedCount}/${thisWeek.totalCount} done (${thisWeek.completionRate}%), ${thisWeek.totalPoints} pts
  Last week: ${lastWeek.completedCount}/${lastWeek.totalCount} done (${lastWeek.completionRate}%), ${lastWeek.totalPoints} pts
  Streak: ${thisWeek.currentStreak} days ${thisWeek.currentStreak >= 3 ? '\uD83D\uDD25' : ''}
  Level: ${level.level} - ${level.title} (${member.points} XP${level.nextXp ? `, next at ${level.nextXp}` : ''})`
}

function buildRewardContext(memberId: string): string {
  const member = useMemberStore.getState().members.find(m => m.id === memberId)
  if (!member) return ''

  const { rewards, redemptions } = useRewardStore.getState()
  if (rewards.length === 0) return ''

  const points = member.points ?? 0
  const rewardLines = rewards.slice(0, 10).map(r => {
    const affordable = points >= r.cost
    const tag = affordable ? 'you can afford this!' : `need ${r.cost - points} more points`
    return `  - ${r.emoji} ${r.name}: ${r.cost} pts (${tag})`
  }).join('\n')

  const memberRedemptions = redemptions
    .filter(rd => rd.memberId === memberId)
    .sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt))
    .slice(0, 5)

  let recentText = ''
  if (memberRedemptions.length > 0) {
    const lines = memberRedemptions.map(rd => {
      const reward = rewards.find(r => r.id === rd.rewardId)
      return `  - ${reward?.emoji ?? ''} ${reward?.name ?? 'Unknown'} (${format(new Date(rd.redeemedAt), 'MMM d')})`
    }).join('\n')
    recentText = `\nRecent redemptions:\n${lines}`
  }

  return `\n\nREWARD SHOP (${points} pts available):\n${rewardLines}${recentText}`
}

function buildChoresSummary(): string {
  const chores = useChoreStore.getState().chores
  const members = useMemberStore.getState().members

  const choreLines = chores.slice(0, 15).map(c => {
    const assignee = members.find(m => m.id === c.assigneeId)?.name ?? 'unassigned'
    return `  - ${c.emoji ?? ''} ${c.name} (${c.recurrence}, ${assignee})`
  }).join('\n')

  const ideas = [
    'Make bed', 'Water plants', 'Set the table', 'Feed pets', 'Tidy toys',
    'Put away laundry', 'Wipe table after meals', 'Brush teeth', 'Read for 15 minutes',
    'Practice instrument', 'Help cook', 'Sweep floor', 'Empty trash',
    'Organize backpack', 'Do homework',
  ].join(', ')

  return `\n\nEXISTING CHORES:\n${choreLines || '  (none yet)'}
CHORE IDEAS: ${ideas}`
}

function buildMemberDirectory(): string {
  const members = useMemberStore.getState().members
  if (members.length === 0) return ''
  const lines = members.map(m => `  - "${m.name}" (ID: ${m.id})`).join('\n')
  return `\n\nFAMILY MEMBERS:\n${lines}`
}

function buildChoreContext(memberId: string): string {
  const members = useMemberStore.getState().members
  const member = members.find((m) => m.id === memberId)
  if (!member) return ''

  const today = format(new Date(), 'yyyy-MM-dd')
  const store = useChoreStore.getState()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const occurrences = store.getOccurrencesForRange(todayStart, todayEnd)
    .filter((o) => o.chore.assigneeId === memberId)

  const done = occurrences.filter((o) => o.isCompleted)
  const pending = occurrences.filter((o) => o.isPending && !o.isCompleted)
  const notDone = occurrences.filter((o) => !o.isCompleted && !o.isPending && !o.isSkipped)

  const doneList = done.map((o) => `  - ${o.chore.emoji || '✅'} ${o.chore.name} (DONE, earned: ${o.chore.points} points)`).join('\n')
  const pendingList = pending.map((o) => `  - ${o.chore.emoji || '⏳'} ${o.chore.name} (PENDING APPROVAL, waiting for parent to check, reward: ${o.chore.points} points)`).join('\n')
  const todoList = notDone.map((o) => `  - ${o.chore.emoji || '📋'} ${o.chore.name} (NOT DONE, reward: ${o.chore.points} points when finished)`).join('\n')

  const allLists = [doneList, pendingList, todoList].filter(Boolean).join('\n')

  // Motivation hint
  const totalCount = occurrences.length
  const doneCount = done.length
  let motivation = ''
  if (totalCount > 0) {
    if (doneCount === totalCount) {
      motivation = `\nMOTIVATION HINT: All ${totalCount} chores done! Celebrate!`
    } else {
      motivation = `\nMOTIVATION HINT: ${doneCount} of ${totalCount} chores done${doneCount >= totalCount / 2 ? ' — almost there!' : ' — keep going!'}`
    }
  }

  // Streak info
  const { chores: allChores, completions: comps, skipped: skip } = store
  const kidChores = allChores.filter(c => c.assigneeId === memberId)
  const streak = computeStreak(memberId, kidChores, comps, skip)
  if (streak > 0) {
    motivation += ` Streak: ${streak} day${streak > 1 ? 's' : ''} ${streak >= 3 ? '\uD83D\uDD25' : ''}`
  }

  return `\n\nCurrent kid: ${member.name} (ID: ${member.id}).
Total points earned so far: ${member.points}
Date: ${today}
Today's chores:
${allLists || '  (all done! \uD83C\uDF89)'}${motivation}` + buildProgressContext(memberId) + buildRewardContext(memberId)
}

function buildGeneralContext(): string {
  const members = useMemberStore.getState().members
  if (members.length === 0) return ''

  const today = format(new Date(), 'yyyy-MM-dd')
  const store = useChoreStore.getState()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const allOccurrences = store.getOccurrencesForRange(todayStart, todayEnd)

  const lines = members.map(m => {
    const memberOccs = allOccurrences.filter(o => o.chore.assigneeId === m.id)
    const done = memberOccs.filter(o => o.isCompleted).length
    const total = memberOccs.length
    return `  - ${m.name}: ${done}/${total} chores done (${m.points} points)`
  }).join('\n')

  return `\n\nYou are in PARENT mode (admin). Date: ${today}\nFamily overview:\n${lines}`
}

export function buildSystemPrompt(memberId: string | null): string {
  const now = format(new Date(), 'EEEE, MMMM d, yyyy h:mm a')
  const context = memberId ? buildChoreContext(memberId) : buildGeneralContext()
  return BASE_SYSTEM_PROMPT + CHORE_CREATION_PROMPT + `\n\nCurrent date and time: ${now}` + context + buildMemberDirectory() + buildChoresSummary()
}

/**
 * Detect the language of a text message based on character patterns.
 * Vietnamese diacritics → Vietnamese, CJK characters → Chinese, else English.
 */
export function detectLanguage(text: string): 'English' | 'Vietnamese' | 'Chinese' {
  // Vietnamese-specific diacritical marks and characters
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i
  if (vietnamesePattern.test(text)) return 'Vietnamese'

  // CJK Unified Ideographs
  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf]/
  if (chinesePattern.test(text)) return 'Chinese'

  return 'English'
}

/** Inject language hint into the last user message */
function addLanguageHint(content: string, isLastUser: boolean): string {
  if (!isLastUser) return content
  const lang = detectLanguage(content)
  return content + `\n\n[LANGUAGE HINT: User is writing in ${lang}. You MUST reply in ${lang} ONLY. Do not use any other language.]`
}

/** Check if Ollama is running and reachable */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

/** Batch (non-streaming) request to Ollama — used as fallback */
export async function sendToOllama(messages: ChatMessage[]): Promise<string> {
  const hasImages = messages.some((msg) => !!msg.image)
  const model = hasImages ? VISION_MODEL : TEXT_MODEL

  const processed = messages.map((msg, i) => {
    const isLastUser = msg.role === 'user' && i === messages.length - 1
    const textContent = addLanguageHint(msg.content, isLastUser)

    if (msg.image) {
      return {
        role: msg.role,
        content: [
          { type: 'text' as const, text: textContent },
          { type: 'image_url' as const, image_url: { url: msg.image } },
        ],
      }
    }

    return { role: msg.role, content: textContent }
  })

  let res: Response
  try {
    res = await fetch(`${OLLAMA_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: processed,
        temperature: 0.7,
        max_tokens: 300,
      }),
    })
  } catch {
    throw new Error('Buddy is sleeping! Ask a parent to start Ollama so I can chat with you.')
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Vision model "${model}" is not installed. Ask a parent to run: ollama pull ${model}`
      )
    }
    throw new Error(`Buddy had a hiccup! (error ${res.status}) Try again in a moment.`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? "Hmm, I got confused. Try again! 😊"
}

/** Streaming request to Ollama — shows tokens as they arrive */
export async function streamFromOllama(
  messages: ChatMessage[],
  onToken: (token: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const hasImages = messages.some((msg) => !!msg.image)
  const model = hasImages ? VISION_MODEL : TEXT_MODEL

  // Ollama native API uses `images: [base64String]` (no data URL prefix)
  const processed = messages.map((msg, i) => {
    const isLastUser = msg.role === 'user' && i === messages.length - 1
    const textContent = addLanguageHint(msg.content, isLastUser)

    const images = msg.image
      ? [msg.image.replace(/^data:[^;]+;base64,/, '')]
      : undefined

    return { role: msg.role, content: textContent, ...(images ? { images } : {}) }
  })

  let res: Response
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model,
        messages: processed,
        stream: true,
        options: { temperature: 0.7, num_predict: 300 },
      }),
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new Error('Buddy is sleeping! Ask a parent to start Ollama so I can chat with you.')
  }

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Vision model "${model}" is not installed. Ask a parent to run: ollama pull ${model}`
      )
    }
    throw new Error(`Buddy had a hiccup! (error ${res.status}) Try again in a moment.`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  const IDLE_TIMEOUT_MS = 60000

  try {
    while (true) {
      // Race the read against an idle timeout to detect Ollama hangs mid-stream
      let idleTimerId: ReturnType<typeof setTimeout>
      const idlePromise = new Promise<never>((_, reject) => {
        idleTimerId = setTimeout(
          () => reject(new Error('Ollama stopped responding mid-stream. Try again.')),
          IDLE_TIMEOUT_MS
        )
      })

      let readResult: { done: boolean; value?: Uint8Array }
      try {
        readResult = await Promise.race([reader.read(), idlePromise])
      } finally {
        clearTimeout(idleTimerId!)
      }

      const { done, value } = readResult
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line)
          const token = json.message?.content || ''
          if (token) {
            fullText += token
            onToken(token)
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return fullText
}
