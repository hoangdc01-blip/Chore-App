/**
 * Text-to-Speech utility using the browser's Web Speech API.
 * Splits text into sentence chunks to avoid the Chrome/Safari stuttering bug.
 */

/** Detect language from text content */
function detectTTSLang(text: string): string {
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i
  if (vietnamesePattern.test(text)) return 'vi-VN'

  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf]/
  if (chinesePattern.test(text)) return 'zh-CN'

  return 'en-US'
}

/** Clean text for speech: strip emojis, action blocks, markdown */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\[.*?\].*?\[\/.*?\]/gs, '')
    .replace(/[\u{1F600}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[*_~`#]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Split text into sentence-sized chunks for smooth speech */
function splitIntoChunks(text: string): string[] {
  // Split on sentence endings, keeping reasonable chunk sizes
  const sentences = text.match(/[^.!?。！？]+[.!?。！？]?\s*/g) || [text]
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + sentence).length > 150) {
      if (current.trim()) chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())

  return chunks.length > 0 ? chunks : [text]
}

let currentChunks: string[] = []
let currentChunkIndex = 0
let currentLang = 'en-US'
let isCancelled = false

/** Find the best voice for a language, preferring American English */
function findVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (lang === 'en-US') {
    // Prefer American voices: Samantha, Alex, or any en-US
    return voices.find(v => v.name === 'Samantha' && v.lang === 'en-US')
      || voices.find(v => v.lang === 'en-US' && v.localService)
      || voices.find(v => v.lang === 'en-US')
      || null
  }
  return voices.find(v => v.lang === lang && v.localService)
    || voices.find(v => v.lang === lang)
    || null
}

function speakNextChunk(): void {
  if (isCancelled || currentChunkIndex >= currentChunks.length) return

  const chunk = currentChunks[currentChunkIndex]
  const utterance = new SpeechSynthesisUtterance(chunk)
  utterance.rate = 0.9
  utterance.pitch = 1.1
  utterance.lang = currentLang

  const voice = findVoice(currentLang)
  if (voice) utterance.voice = voice

  utterance.onend = () => {
    currentChunkIndex++
    speakNextChunk()
  }

  utterance.onerror = () => {
    currentChunkIndex++
    speakNextChunk()
  }

  window.speechSynthesis.speak(utterance)
}

export function speak(text: string, lang?: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  stopSpeaking()

  const cleaned = cleanForSpeech(text)
  if (!cleaned) return

  currentLang = lang || detectTTSLang(text)
  currentChunks = splitIntoChunks(cleaned)
  currentChunkIndex = 0
  isCancelled = false

  speakNextChunk()
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  isCancelled = true
  window.speechSynthesis.cancel()
  currentChunks = []
  currentChunkIndex = 0
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  return window.speechSynthesis.speaking || (currentChunkIndex < currentChunks.length && !isCancelled)
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
