import { format } from 'date-fns'
import { useMemberStore } from '../store/member-store'
import { useChoreStore } from '../store/chore-store'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Base64 data URL of an attached image (e.g. "data:image/jpeg;base64,...") */
  image?: string
}

// Configurable via environment variables
const TEXT_MODEL = import.meta.env.VITE_OLLAMA_TEXT_MODEL || 'qwen2.5:3b'
const VISION_MODEL = import.meta.env.VITE_OLLAMA_VISION_MODEL || 'llava:7b'
const OLLAMA_BASE = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'

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

You help with: 1) Daily chores 2) Fun facts 3) Homework (math/science/Chinese)
Never discuss anything inappropriate or scary. Be kind, patient, fun.`

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

  return `\n\nCurrent kid: ${member.name}.
Total points earned so far: ${member.points}
Date: ${today}
Today's chores:
${allLists || '  (all done! 🎉)'}`
}

export function buildSystemPrompt(memberId: string | null): string {
  const context = memberId ? buildChoreContext(memberId) : ''
  return BASE_SYSTEM_PROMPT + context
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

  try {
    while (true) {
      const { done, value } = await reader.read()
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
