// Web Audio API sound effects — no external files needed

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

export function playFlap() {
  playTone(400, 0.1, 'sine', 0.12)
  setTimeout(() => playTone(500, 0.08, 'sine', 0.1), 50)
}

export function playScore() {
  playTone(600, 0.1, 'sine', 0.15)
  setTimeout(() => playTone(800, 0.15, 'sine', 0.12), 100)
}

export function playGameOver() {
  playTone(300, 0.2, 'square', 0.12)
  setTimeout(() => playTone(200, 0.3, 'square', 0.1), 200)
  setTimeout(() => playTone(100, 0.5, 'square', 0.08), 400)
}

export function playHighScore() {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.15), i * 120)
  })
}

export function playBonusPoints() {
  playTone(880, 0.1, 'sine', 0.12)
  setTimeout(() => playTone(1100, 0.1, 'sine', 0.12), 80)
  setTimeout(() => playTone(1320, 0.15, 'sine', 0.15), 160)
}

// ── Memory Match sounds ──

export function playCardFlip() {
  playTone(500, 0.06, 'sine', 0.1)
}

export function playMatch() {
  playTone(660, 0.1, 'sine', 0.15)
  setTimeout(() => playTone(880, 0.15, 'sine', 0.12), 100)
}

export function playMismatch() {
  playTone(250, 0.15, 'square', 0.08)
  setTimeout(() => playTone(200, 0.2, 'square', 0.06), 120)
}

export function playAllMatched() {
  const notes = [523, 659, 784, 880, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.15), i * 100)
  })
}

// ── Dino Run sounds ──

export function playJump() {
  playTone(350, 0.08, 'sine', 0.12)
  setTimeout(() => playTone(500, 0.06, 'sine', 0.1), 60)
}

export function playMilestone() {
  playTone(800, 0.08, 'sine', 0.12)
  setTimeout(() => playTone(1000, 0.1, 'sine', 0.12), 80)
  setTimeout(() => playTone(1200, 0.12, 'sine', 0.15), 160)
}
