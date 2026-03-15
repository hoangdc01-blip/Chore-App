/**
 * Text-to-Speech utility using the browser's Web Speech API.
 * Works on all modern browsers including iPad Safari.
 */

/** Detect language from text content */
function detectTTSLang(text: string): string {
  // Vietnamese diacritics
  const vietnamesePattern = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i
  if (vietnamesePattern.test(text)) return 'vi-VN'

  // CJK characters
  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf]/
  if (chinesePattern.test(text)) return 'zh-CN'

  return 'en-US'
}

/** Clean text for speech: strip emojis, action blocks, markdown */
function cleanForSpeech(text: string): string {
  return text
    .replace(/\[.*?\].*?\[\/.*?\]/gs, '') // remove action blocks like [CREATE_CHORE]...[/CREATE_CHORE]
    .replace(/[\u{1F600}-\u{1FFFF}]/gu, '') // remove emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // remove misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // remove dingbats
    .replace(/[*_~`#]/g, '') // remove markdown formatting
    .replace(/\s{2,}/g, ' ') // collapse multiple spaces
    .trim()
}

export function speak(text: string, lang?: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  const cleaned = cleanForSpeech(text)
  if (!cleaned) return

  const utterance = new SpeechSynthesisUtterance(cleaned)
  utterance.rate = 0.9   // slightly slower for kids
  utterance.pitch = 1.1  // slightly higher pitch, friendlier
  utterance.lang = lang || detectTTSLang(text)

  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  return window.speechSynthesis.speaking
}

export function isTTSAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
