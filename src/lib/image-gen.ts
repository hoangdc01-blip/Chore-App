import { getEnv } from './env'

// Default: AUTOMATIC1111 SD Web UI API
const SD_URL = getEnv('VITE_SD_URL', 'http://127.0.0.1:7860')

export async function generateImage(prompt: string): Promise<{ imageBase64: string; mimeType: string } | null> {
  const kidSafePrompt = `${prompt}, cartoon style, colorful, cute, kid-friendly, cheerful, bright colors, simple, no text`
  const negativePrompt = 'scary, violent, dark, realistic, nsfw, ugly, deformed, blurry, text, watermark, signature'

  // Try AUTOMATIC1111 API first
  try {
    const res = await fetch(`${SD_URL}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: kidSafePrompt,
        negative_prompt: negativePrompt,
        steps: 20,
        cfg_scale: 7,
        width: 512,
        height: 512,
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
    // Try Draw Things API as fallback (runs on port 7888 by default)
    try {
      const drawThingsRes = await fetch('http://127.0.0.1:7888/sdapi/v1/txt2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: kidSafePrompt,
          negative_prompt: negativePrompt,
          steps: 20,
          cfg_scale: 7,
          width: 512,
          height: 512,
          n_iter: 1,
          batch_size: 1,
        })
      })

      if (!drawThingsRes.ok) throw new Error('Draw Things API error')

      const drawData = await drawThingsRes.json()
      const base64 = drawData.images?.[0]
      if (!base64) return null

      return { imageBase64: base64, mimeType: 'image/png' }
    } catch {
      return null
    }
  }
}

export async function isImageGenAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${SD_URL}/sdapi/v1/sd-models`, {
      signal: AbortSignal.timeout(3000)
    })
    return res.ok
  } catch {
    // Try Draw Things
    try {
      const res = await fetch('http://127.0.0.1:7888/sdapi/v1/sd-models', {
        signal: AbortSignal.timeout(3000)
      })
      return res.ok
    } catch {
      return false
    }
  }
}
