/**
 * Text-to-Speech utility.
 * Tries Kokoro TTS (local, natural voice) first, falls back to browser Web Speech API.
 * Splits text into sentence chunks for Web Speech to avoid Chrome/Safari stuttering bug.
 */

import { getEnv } from './env'

const KOKORO_URL = getEnv('VITE_KOKORO_URL', 'http://localhost:8880')

const getKokoroBaseUrl = () => {
  if (import.meta.env.DEV) return '/kokoro-api'
  return KOKORO_URL
}

/** Module-level audio element for Kokoro playback */
let currentAudio: HTMLAudioElement | null = null
/** Cached Kokoro availability (null = not yet checked) */
let kokoroAvailable: boolean | null = null

// Re-check Kokoro availability every 60 seconds
setInterval(() => { kokoroAvailable = null }, 60000)

/** Check if Kokoro TTS server is reachable */
async function checkKokoroAvailable(): Promise<boolean> {
  if (kokoroAvailable !== null) return kokoroAvailable
  try {
    const baseUrl = getKokoroBaseUrl()
    const res = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify({ model: 'kokoro', input: 'test', voice: 'af_heart' }),
    })
    kokoroAvailable = res.ok
    return kokoroAvailable
  } catch {
    kokoroAvailable = false
    return false
  }
}

/** Speak text using Kokoro TTS. Returns true if audio played successfully. */
async function speakWithKokoro(text: string): Promise<boolean> {
  try {
    const baseUrl = getKokoroBaseUrl()
    const res = await fetch(`${baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: 'kokoro',
        input: text,
        voice: 'af_heart',
        response_format: 'mp3',
        speed: 0.9,
      }),
    })
    if (!res.ok) return false
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)

    // Stop any currently playing Kokoro audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.src = ''
      URL.revokeObjectURL(currentAudio.dataset.blobUrl || '')
    }

    const audio = new Audio(url)
    audio.dataset.blobUrl = url
    currentAudio = audio

    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url)
        if (currentAudio === audio) currentAudio = null
        resolve(true)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        if (currentAudio === audio) currentAudio = null
        resolve(false)
      }
      audio.play().catch(() => {
        URL.revokeObjectURL(url)
        if (currentAudio === audio) currentAudio = null
        resolve(false)
      })
    })
  } catch {
    return false
  }
}

// ─── Language detection & text cleaning ───────────────────────────────────────

/** Detect language from text content */
export function detectTTSLang(text: string): string {
  // Count Vietnamese vs English characters to determine dominant language
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/gi
  const vietnameseMatches = text.match(vietnamesePattern)
  if (vietnameseMatches && vietnameseMatches.length > 2) return 'vi-VN'

  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf]/g
  const chineseMatches = text.match(chinesePattern)
  if (chineseMatches && chineseMatches.length > 2) return 'zh-CN'

  return 'en-US'
}

/** Clean text for speech: strip everything that shouldn't be spoken */
function cleanForSpeech(text: string): string {
  return text
    // Remove action blocks [TAG]...[/TAG]
    .replace(/\[.*?\][\s\S]*?\[\/.*?\]/g, '')
    // Remove partial/opening action blocks
    .replace(/\[(?:DRAW_IMAGE|GENERATE_PRESENTATION|HOMEWORK_CHECK|CREATE_CHORE|REDEEM_REWARD)[^\]]*\][\s\S]*/g, '')
    // Remove ALL emoji and symbol unicode ranges
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{200D}]/gu, '') // zero-width joiner
    .replace(/[\u{E0020}-\u{E007F}]/gu, '') // tag characters
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[\u{231A}-\u{23FF}]/gu, '')
    .replace(/[\u{2B50}]/gu, '')
    .replace(/[\u{2702}-\u{27B0}]/gu, '')
    // Remove markdown formatting
    .replace(/[*_~`#]/g, '')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, '')
    // Remove parenthetical notes like (e.g., ...)
    .replace(/\([^)]*\)/g, '')
    // Clean up whitespace
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.\s*\./g, '.')
    .trim()
}

// ─── Web Speech API (fallback) ───────────────────────────────────────────────

/** Split text into sentence-sized chunks for smooth speech */
function splitIntoChunks(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]?\s*/g) || [text]
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue
    if ((current + ' ' + trimmed).length > 120) {
      if (current.trim()) chunks.push(current.trim())
      current = trimmed
    } else {
      current = current ? current + ' ' + trimmed : trimmed
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks.length > 0 ? chunks : [text]
}

let currentChunks: string[] = []
let currentChunkIndex = 0
let currentLang = 'en-US'
let isCancelled = false
let voicesLoaded = false

/** Ensure voices are loaded (Safari loads them async) */
function ensureVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      voicesLoaded = true
      resolve(voices)
      return
    }
    // Safari/iOS loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true
      resolve(window.speechSynthesis.getVoices())
    }
    // Fallback timeout
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500)
  })
}

/** Find the best voice for a language */
function findVoice(lang: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (lang === 'en-US') {
    // Prefer high-quality American voices
    return voices.find(v => v.name === 'Samantha' && v.lang === 'en-US')
      || voices.find(v => v.name.includes('Samantha'))
      || voices.find(v => v.lang === 'en-US' && v.localService && !v.name.includes('Compact'))
      || voices.find(v => v.lang === 'en-US' && !v.name.includes('Compact'))
      || voices.find(v => v.lang.startsWith('en') && v.localService)
      || null
  }
  if (lang === 'vi-VN') {
    return voices.find(v => v.lang === 'vi-VN' && v.localService)
      || voices.find(v => v.lang === 'vi-VN')
      || voices.find(v => v.lang.startsWith('vi'))
      || null
  }
  return voices.find(v => v.lang === lang && v.localService)
    || voices.find(v => v.lang === lang)
    || null
}

function speakNextChunk(): void {
  if (isCancelled || currentChunkIndex >= currentChunks.length) return

  const chunk = currentChunks[currentChunkIndex]
  if (!chunk || chunk.length < 2) {
    currentChunkIndex++
    speakNextChunk()
    return
  }

  const utterance = new SpeechSynthesisUtterance(chunk)
  utterance.rate = 0.85  // slower for kids
  utterance.pitch = 1.05
  utterance.lang = currentLang

  const voices = window.speechSynthesis.getVoices()
  const voice = findVoice(currentLang, voices)
  if (voice) utterance.voice = voice

  utterance.onend = () => {
    currentChunkIndex++
    // Small pause between chunks for natural speech
    setTimeout(() => speakNextChunk(), 150)
  }

  utterance.onerror = () => {
    currentChunkIndex++
    speakNextChunk()
  }

  window.speechSynthesis.speak(utterance)
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function speak(text: string, lang?: string): Promise<void> {
  if (typeof window === 'undefined') return

  stopSpeaking()

  const cleaned = cleanForSpeech(text)
  if (!cleaned || cleaned.length < 2) return

  const detectedLang = lang || 'en-US'

  // Only use Kokoro for English without explicit lang override (chat/stories)
  // Language learning needs browser voices for precise pronunciation
  if (!lang) {
    const kokoroOk = await checkKokoroAvailable()
    if (kokoroOk) {
      const success = await speakWithKokoro(cleaned)
      if (success) return
    }
  }

  // Fallback: Web Speech API
  if (!window.speechSynthesis) return
  if (!voicesLoaded) await ensureVoices()

  currentLang = detectedLang
  currentChunks = splitIntoChunks(cleaned)
  currentChunkIndex = 0
  isCancelled = false

  speakNextChunk()
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return

  // Stop Kokoro audio
  if (currentAudio) {
    currentAudio.pause()
    const blobUrl = currentAudio.dataset.blobUrl
    if (blobUrl) URL.revokeObjectURL(blobUrl)
    currentAudio.src = ''
    currentAudio = null
  }

  // Stop Web Speech API
  if (window.speechSynthesis) {
    isCancelled = true
    window.speechSynthesis.cancel()
    currentChunks = []
    currentChunkIndex = 0
  }
}

export function isSpeaking(): boolean {
  // Check Kokoro audio
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) return true

  // Check Web Speech API
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  return window.speechSynthesis.speaking || (currentChunkIndex < currentChunks.length && !isCancelled)
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && ('speechSynthesis' in window || kokoroAvailable === true)
}
