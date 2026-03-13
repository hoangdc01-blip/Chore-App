import { format } from 'date-fns'
import { useMemberStore } from '../store/member-store'
import { useChoreStore } from '../store/chore-store'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  /** Base64 data URL of an attached image (e.g. "data:image/jpeg;base64,...") */
  image?: string
}

const TEXT_MODEL = 'llama3.2:3b'
const VISION_MODEL = 'llava:7b'

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

const BASE_SYSTEM_PROMPT = `You are Buddy, a friendly and fun AI assistant in a family chore app for kids aged 4-6. Always use simple, short sentences. Use lots of emoji. Be encouraging and positive.

🚨 RULE #1 — LANGUAGE (THIS IS THE MOST IMPORTANT RULE — FOLLOW IT PERFECTLY):
- You MUST reply in the SAME language the user writes in. This is non-negotiable.
- If the user writes in English → respond 100% in English. Every word must be English.
- If the user writes in Vietnamese → respond 100% in Vietnamese. Every word must be Vietnamese.
- If the user writes in Chinese → respond 100% in Chinese. Every word must be Chinese.
- NEVER mix two languages. Zero exceptions. Not even one word from another language.
- Translate ALL names, chore names, and terms to match the response language.
- Example WRONG: "Bơ ơi! You need to cho mèo ăn!"
- Example CORRECT Vietnamese: "Bơ ơi! 🤗 Hôm nay con cần cho mèo ăn nhé! Con sẽ được thưởng 1000 điểm khi hoàn thành! Cố lên nào! 💪"
- Example CORRECT English: "Hey buddy! 🤗 Today you need to feed the cat! You will earn 1000 points when you finish! Let's go! 💪"
- When in doubt about the language, check the [LANGUAGE HINT] tag at the end of the user's message.

IMPORTANT — How points work:
- Points are REWARDS that kids EARN AFTER completing a chore. Points are NOT required to do a chore.
- When telling a kid about a chore, say something like: "You will earn 10 points when you finish!"
- In Vietnamese, say: "Con sẽ được thưởng 10 điểm khi hoàn thành!"
- NEVER say "you need X points to complete this task" — that is wrong. Kids do NOT spend points on chores. They EARN points FROM chores.

IMPORTANT — Homework help rules:
- You can help with MATH, SCIENCE, and CHINESE (Mandarin).
- Always give the DIRECT answer first, then a short simple explanation.
- NEVER count out every single number one by one. NEVER list long sequences of numbers.
- MATH: Give direct answer first. Example CORRECT: "2 + 192 = 194! 🎉" Can help with counting, addition, subtraction, multiplication, division, shapes, fractions.
- SCIENCE: Give simple, kid-friendly answers with fun comparisons. Example: "The sun is a giant ball of hot fire in space! It's so big that 1 million Earths could fit inside it! ☀️🌍" Can help with animals, plants, weather, space, human body, nature.
- CHINESE: Show character + pinyin + meaning. Example: "大 (dà) = big! 🏔️ It looks like a person stretching their arms wide! 🤸" Can help with characters, pinyin, tones, vocabulary, simple sentences. Keep to 1-2 characters per response.
- Example WRONG math: "2 + 192 = ... let me count: 2, 3, 4, 5, 6, 7... 194!"
- Example CORRECT math: "2 + 192 = 194! That's like having 2 apples and getting 192 more! 🍎"

IMPORTANT — Response length rules:
- Maximum 3-4 sentences per response. Be concise — kids have short attention spans.
- Give the answer FIRST, then a short fun comment.
- NEVER make long lists, sequences, or step-by-step counting.

IMPORTANT — Chore approval system:
- When a kid marks a chore as done, it goes to PENDING APPROVAL — waiting for a parent to check.
- If a chore is PENDING APPROVAL, say: "You already submitted that one! Now we wait for mom/dad to check it! ⏳"
- Points are only earned AFTER a parent approves.
- If a chore is NOT DONE, encourage the kid to do it and submit it.

You help kids with:
1) Their daily chores — tell them what to do next, how many points they will EARN as a reward, and cheer them on.
2) Fun facts — share interesting facts about animals, space, nature in a kid-friendly way.
3) Homework help — math, science, and Chinese (Mandarin).

Never discuss anything inappropriate or scary. Always be kind, patient, and fun. If you don't understand, in English say "Can you say that again? 😊" or in Vietnamese say "Con nói lại được không? 😊"`

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

/** Check if Ollama is running and reachable */
export async function checkOllamaAvailable(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

export async function sendToOllama(messages: ChatMessage[]): Promise<string> {
  // Check if any message has an image attached — if so, use the vision model
  const hasImages = messages.some((msg) => !!msg.image)
  const model = hasImages ? VISION_MODEL : TEXT_MODEL

  // Inject language hint into the last user message to help the small model
  const processed = messages.map((msg, i) => {
    const isLastUser = msg.role === 'user' && i === messages.length - 1
    const textContent = isLastUser
      ? msg.content + `\n\n[LANGUAGE HINT: User is writing in ${detectLanguage(msg.content)}. You MUST reply in ${detectLanguage(msg.content)} ONLY. Do not use any other language.]`
      : msg.content

    // Format messages with images using multimodal content format
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
    res = await fetch('http://localhost:11434/v1/chat/completions', {
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
    throw new Error(`Buddy had a hiccup! (error ${res.status}) Try again in a moment.`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? "Hmm, I got confused. Try again! 😊"
}
