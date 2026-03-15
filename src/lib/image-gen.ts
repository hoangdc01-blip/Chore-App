import { getEnv } from './env'

const GEMINI_API_KEY = getEnv('VITE_GEMINI_API_KEY', '')
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`

export async function generateImage(prompt: string): Promise<{ imageBase64: string; mimeType: string } | null> {
  if (!GEMINI_API_KEY) return null

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `Generate a colorful, kid-friendly, cartoon-style image of: ${prompt}. Make it cheerful, bright colors, suitable for children aged 4-7. No scary or violent content.` }]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    })
  })

  if (!res.ok) return null

  const data = await res.json()
  // Gemini returns parts array - find the image part
  const parts = data.candidates?.[0]?.content?.parts || []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imagePart = parts.find((p: any) => p.inlineData)

  if (!imagePart) return null

  return {
    imageBase64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType || 'image/png'
  }
}

export function isImageGenAvailable(): boolean {
  return !!GEMINI_API_KEY
}
