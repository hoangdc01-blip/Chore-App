import { getEnv } from './env'

// Default: AUTOMATIC1111 SD Web UI / Draw Things API
const SD_URL = getEnv('VITE_SD_URL', 'http://127.0.0.1:7860')

// In dev mode, use Vite proxy to avoid CORS
// In production, call the SD URL directly
const getBaseUrl = () => {
  if (import.meta.env.DEV) return '/sd-api'
  return SD_URL
}

const IMAGE_GEN_TIMEOUT = 60_000

export async function generateImage(prompt: string): Promise<{ imageBase64: string; mimeType: string } | null> {
  const kidSafePrompt = `${prompt}, simple coloring book style, thick black outlines, clean lines, white background, simple shapes, minimal detail, cute cartoon, for young children to color, no shading, no gradients, flat colors`
  const negativePrompt = 'scary, violent, dark, realistic, nsfw, ugly, deformed, blurry, text, watermark, signature, detailed, complex, shading, gradients, artistic, abstract, photorealistic'

  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(IMAGE_GEN_TIMEOUT),
      body: JSON.stringify({
        prompt: kidSafePrompt,
        negative_prompt: negativePrompt,
        steps: 8,
        cfg_scale: 4,
        width: 1024,
        height: 1024,
        sampler_name: 'Euler a',
        n_iter: 1,
        batch_size: 1,
      })
    })

    if (!res.ok) throw new Error(`SD API error: ${res.status}`)

    const data = await res.json()
    const base64Image = data.images?.[0]
    if (!base64Image) return null

    return { imageBase64: base64Image, mimeType: 'image/png' }
  } catch {
    return null
  }
}

export async function isImageGenAvailable(): Promise<boolean> {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/sdapi/v1/sd-models`, {
      signal: AbortSignal.timeout(3000)
    })
    return res.ok
  } catch {
    return false
  }
}
