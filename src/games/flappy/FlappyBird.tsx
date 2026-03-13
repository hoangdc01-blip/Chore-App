import { useRef, useEffect, useCallback, useState } from 'react'
import { randomTheme, type GameTheme } from './themes'
import { randomCharacter, type GameCharacter } from './characters'
import { playFlap, playScore, playGameOver } from '../sounds'

// ── Game Constants (tuned for kids aged 4-6 — floaty balloon feel) ──
const GRAVITY = 0.12
const FLAP_STRENGTH = -3.8
const MAX_FALL_SPEED = 3.5
const OBSTACLE_WIDTH = 55
const MIN_GAP = 160
const MAX_GAP = 260
const INITIAL_SPEED = 1.0
const MAX_SPEED = 3.0
const GROUND_HEIGHT = 60
const BIRD_SIZE = 30

interface Obstacle {
  x: number
  topHeight: number
  gap: number
  scored: boolean
}

interface Decoration {
  x: number
  y: number
  size: number
  speed: number
}

interface FlappyBirdProps {
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
  isPlaying: boolean
  onStart: () => void
  highScore: number
}

export default function FlappyBird({ onScore, onGameOver, isPlaying, onStart, highScore }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [theme] = useState<GameTheme>(() => randomTheme())
  const [character] = useState<GameCharacter>(() => randomCharacter())
  // Game state refs (avoid re-renders during game loop)
  const birdY = useRef(0)
  const birdVelocity = useRef(0)
  const birdRotation = useRef(0)
  const obstacles = useRef<Obstacle[]>([])
  const decorations = useRef<Decoration[]>([])
  const score = useRef(0)
  const frameCount = useRef(0)
  const gameOver = useRef(false)
  const started = useRef(false)
  const animFrame = useRef(0)
  const flapFrame = useRef(0)
  const speed = useRef(INITIAL_SPEED)
  const canvasSize = useRef({ w: 0, h: 0 })

  const getGap = useCallback(() => {
    // Gap shrinks very slowly — stays easy for first ~15 obstacles
    return Math.max(MIN_GAP, MAX_GAP - score.current * 0.8)
  }, [])

  const getSpeed = useCallback(() => {
    // Speed ramps up gradually: easy first 10 points, then accelerates
    return Math.min(MAX_SPEED, INITIAL_SPEED + score.current * 0.06)
  }, [])

  const initDecorations = useCallback((w: number, h: number) => {
    const decors: Decoration[] = []
    const count = theme.decorations === 'stars' ? 40 : 12
    for (let i = 0; i < count; i++) {
      decors.push({
        x: Math.random() * w * 2,
        y: Math.random() * (h - GROUND_HEIGHT),
        size: Math.random() * 15 + 5,
        speed: Math.random() * 0.5 + 0.3,
      })
    }
    return decors
  }, [theme])

  const resetGame = useCallback(() => {
    const h = canvasSize.current.h
    birdY.current = h * 0.4
    birdVelocity.current = 0
    birdRotation.current = 0
    obstacles.current = []
    score.current = 0
    frameCount.current = 0
    gameOver.current = false
    started.current = false
    speed.current = INITIAL_SPEED
    flapFrame.current = 0
    decorations.current = initDecorations(canvasSize.current.w, h)
  }, [initDecorations])

  const flap = useCallback(() => {
    if (gameOver.current) return
    if (!started.current) {
      started.current = true
      onStart()
    }
    birdVelocity.current = FLAP_STRENGTH
    flapFrame.current = 10
    playFlap()
  }, [onStart])

  // ── Drawing Functions ──

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, theme.skyGradient[0])
    grad.addColorStop(1, theme.skyGradient[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }, [theme])

  const drawDecorations = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    for (const d of decorations.current) {
      ctx.save()
      if (theme.decorations === 'clouds') {
        ctx.fillStyle = theme.decorColor1
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2)
        ctx.arc(d.x + d.size * 0.8, d.y - d.size * 0.3, d.size * 0.7, 0, Math.PI * 2)
        ctx.arc(d.x + d.size * 1.4, d.y, d.size * 0.8, 0, Math.PI * 2)
        ctx.fill()
      } else if (theme.decorations === 'stars') {
        ctx.fillStyle = d.size > 12 ? theme.decorColor2 : theme.decorColor1
        ctx.globalAlpha = 0.5 + Math.sin(frameCount.current * 0.05 + d.x) * 0.3
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.size * 0.15, 0, Math.PI * 2)
        ctx.fill()
      } else if (theme.decorations === 'bubbles') {
        ctx.strokeStyle = theme.decorColor1
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.size * 0.5, 0, Math.PI * 2)
        ctx.stroke()
        // Highlight
        ctx.fillStyle = theme.decorColor1
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.arc(d.x - d.size * 0.15, d.y - d.size * 0.15, d.size * 0.12, 0, Math.PI * 2)
        ctx.fill()
      } else if (theme.decorations === 'candy') {
        ctx.globalAlpha = 0.6
        const colors = [theme.decorColor1, theme.decorColor2, theme.decorColor3]
        ctx.fillStyle = colors[Math.floor(d.x) % 3]
        // Lollipop
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.size * 0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = theme.decorColor2
        ctx.fillRect(d.x - 1.5, d.y + d.size * 0.4, 3, d.size * 0.6)
      }
      ctx.restore()

      // Move decoration
      d.x -= d.speed * speed.current * 0.3
      if (d.x < -d.size * 2) {
        d.x = w + d.size * 2
        d.y = Math.random() * (h - GROUND_HEIGHT - 40) + 20
      }
    }
  }, [theme])

  const drawBird = useCallback((ctx: CanvasRenderingContext2D, y: number) => {
    const x = canvasSize.current.w * 0.25
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(birdRotation.current)

    const s = BIRD_SIZE
    const wingOffset = flapFrame.current > 0 ? -6 : 3

    // Body
    ctx.fillStyle = character.bodyColor
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.6, s * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = character.accentColor
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Wing
    ctx.fillStyle = character.wingColor
    ctx.beginPath()
    ctx.ellipse(-4, wingOffset, s * 0.3, s * 0.25, -0.3, 0, Math.PI * 2)
    ctx.fill()

    // Eye (white)
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(s * 0.25, -s * 0.12, s * 0.18, 0, Math.PI * 2)
    ctx.fill()

    // Pupil
    ctx.fillStyle = character.eyeColor
    ctx.beginPath()
    ctx.arc(s * 0.3, -s * 0.1, s * 0.09, 0, Math.PI * 2)
    ctx.fill()

    // Beak
    ctx.fillStyle = '#FF9800'
    ctx.beginPath()
    ctx.moveTo(s * 0.5, -s * 0.05)
    ctx.lineTo(s * 0.8, s * 0.05)
    ctx.lineTo(s * 0.5, s * 0.15)
    ctx.closePath()
    ctx.fill()

    // Belly accent for penguin
    if (character.name === 'Flying Penguin') {
      ctx.fillStyle = character.accentColor
      ctx.beginPath()
      ctx.ellipse(2, 5, s * 0.3, s * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Cheeks for hamster/cat
    if (character.name === 'Flying Hamster' || character.name === 'Flying Cat') {
      ctx.fillStyle = '#FFAB91'
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.arc(s * 0.15, s * 0.15, s * 0.12, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // Ears for cat
    if (character.name === 'Flying Cat') {
      ctx.fillStyle = character.bodyColor
      ctx.beginPath()
      ctx.moveTo(-s * 0.2, -s * 0.45)
      ctx.lineTo(-s * 0.05, -s * 0.7)
      ctx.lineTo(s * 0.1, -s * 0.45)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(s * 0.15, -s * 0.45)
      ctx.lineTo(s * 0.3, -s * 0.7)
      ctx.lineTo(s * 0.45, -s * 0.45)
      ctx.closePath()
      ctx.fill()
    }

    // Ears for dog
    if (character.name === 'Flying Dog') {
      ctx.fillStyle = character.accentColor
      ctx.beginPath()
      ctx.ellipse(-s * 0.35, -s * 0.15, s * 0.15, s * 0.3, -0.4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }, [character])

  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D, h: number) => {
    for (const obs of obstacles.current) {
      const playH = h - GROUND_HEIGHT
      // Top pipe
      ctx.fillStyle = theme.obstacleColor
      ctx.fillRect(obs.x, 0, OBSTACLE_WIDTH, obs.topHeight)
      // Top cap
      ctx.fillStyle = theme.obstacleCapColor
      ctx.fillRect(obs.x - 4, obs.topHeight - 20, OBSTACLE_WIDTH + 8, 20)
      // Pipe highlight
      ctx.fillStyle = theme.obstacleAccent
      ctx.fillRect(obs.x + 5, 0, 8, obs.topHeight - 20)

      // Bottom pipe
      const bottomY = obs.topHeight + obs.gap
      const bottomH = playH - bottomY
      ctx.fillStyle = theme.obstacleColor
      ctx.fillRect(obs.x, bottomY, OBSTACLE_WIDTH, bottomH)
      // Bottom cap
      ctx.fillStyle = theme.obstacleCapColor
      ctx.fillRect(obs.x - 4, bottomY, OBSTACLE_WIDTH + 8, 20)
      // Pipe highlight
      ctx.fillStyle = theme.obstacleAccent
      ctx.fillRect(obs.x + 5, bottomY + 20, 8, bottomH - 20)
    }
  }, [theme])

  const drawGround = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = theme.groundColor
    ctx.fillRect(0, h - GROUND_HEIGHT, w, GROUND_HEIGHT)
    ctx.fillStyle = theme.groundAccent
    ctx.fillRect(0, h - GROUND_HEIGHT, w, 4)
    // Grass/details
    for (let x = (frameCount.current * -speed.current * 0.5) % 20; x < w; x += 20) {
      ctx.fillStyle = theme.groundAccent
      ctx.fillRect(x, h - GROUND_HEIGHT + 4, 10, 3)
    }
  }, [theme])

  const drawScore = useCallback((ctx: CanvasRenderingContext2D, w: number) => {
    ctx.save()
    // Main score — big center
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 4
    ctx.font = 'bold 40px Nunito, sans-serif'
    ctx.textAlign = 'center'
    const text = String(score.current)
    ctx.strokeText(text, w / 2, 80)
    ctx.fillText(text, w / 2, 80)

    // High score — small, below main score
    if (highScore > 0) {
      ctx.font = 'bold 14px Nunito, sans-serif'
      ctx.textAlign = 'center'
      ctx.lineWidth = 2.5
      ctx.strokeStyle = '#000000'
      const hsText = `Best: ${highScore}`
      ctx.strokeText(hsText, w / 2, 100)
      ctx.fillStyle = '#FFD54F'
      ctx.fillText(hsText, w / 2, 100)
    }
    ctx.restore()
  }, [highScore])

  const drawStartScreen = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 28px Nunito, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${character.emoji} ${character.name}`, w / 2, h * 0.35)

    ctx.font = 'bold 20px Nunito, sans-serif'
    ctx.fillStyle = '#FFD54F'
    ctx.fillText(`Theme: ${theme.name}`, w / 2, h * 0.42)

    // High score display
    if (highScore > 0) {
      ctx.font = 'bold 18px Nunito, sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(`🏆 Best: ${highScore}`, w / 2, h * 0.49)
    }

    // Bouncing arrow
    const bounce = Math.sin(frameCount.current * 0.08) * 8
    ctx.font = '18px Nunito, sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('Tap or press Space to start!', w / 2, h * 0.58 + bounce)

    ctx.restore()
  }, [character, theme, highScore])

  // ── Game Loop ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      canvasSize.current = { w, h }
    }

    resize()
    resetGame()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas.parentElement!)

    const birdX = () => canvasSize.current.w * 0.25

    const loop = () => {
      const { w, h } = canvasSize.current
      if (w === 0 || h === 0) {
        animFrame.current = requestAnimationFrame(loop)
        return
      }

      frameCount.current++
      if (flapFrame.current > 0) flapFrame.current--

      // Draw
      drawBackground(ctx, w, h)
      drawDecorations(ctx, w, h)

      if (started.current && !gameOver.current) {
        speed.current = getSpeed()

        // Physics — capped fall speed for floaty feel
        birdVelocity.current += GRAVITY
        if (birdVelocity.current > MAX_FALL_SPEED) birdVelocity.current = MAX_FALL_SPEED
        birdY.current += birdVelocity.current

        // Rotation based on velocity (gentle tilt)
        birdRotation.current = Math.min(Math.max(birdVelocity.current * 0.08, -0.4), 0.8)

        // Spawn obstacles — wide spacing at start, slowly tightens
        const lastObs = obstacles.current[obstacles.current.length - 1]
        const spacing = Math.max(240, 400 - score.current * 4)
        if (!lastObs || lastObs.x < w - spacing) {
          const playH = h - GROUND_HEIGHT
          const gap = getGap()
          const minTop = 50
          const maxTop = Math.max(minTop + 10, playH - gap - 50)
          const topHeight = Math.random() * (maxTop - minTop) + minTop
          obstacles.current.push({ x: w + 20, topHeight, gap, scored: false })
        }

        // Move & check obstacles
        const bx = birdX()
        for (let i = obstacles.current.length - 1; i >= 0; i--) {
          const obs = obstacles.current[i]
          obs.x -= speed.current

          // Score
          if (!obs.scored && obs.x + OBSTACLE_WIDTH < bx - BIRD_SIZE * 0.5) {
            obs.scored = true
            score.current++
            onScore(score.current)
            playScore()
          }

          // Remove off-screen
          if (obs.x + OBSTACLE_WIDTH < -10) {
            obstacles.current.splice(i, 1)
          }

          // Collision
          const birdLeft = bx - BIRD_SIZE * 0.5
          const birdRight = bx + BIRD_SIZE * 0.5
          const birdTop = birdY.current - BIRD_SIZE * 0.4
          const birdBottom = birdY.current + BIRD_SIZE * 0.4

          if (
            birdRight > obs.x &&
            birdLeft < obs.x + OBSTACLE_WIDTH
          ) {
            if (birdTop < obs.topHeight || birdBottom > obs.topHeight + obs.gap) {
              gameOver.current = true
              playGameOver()
              onGameOver(score.current)
            }
          }
        }

        // Ground/ceiling collision
        if (birdY.current + BIRD_SIZE * 0.4 > h - GROUND_HEIGHT) {
          birdY.current = h - GROUND_HEIGHT - BIRD_SIZE * 0.4
          gameOver.current = true
          playGameOver()
          onGameOver(score.current)
        }
        if (birdY.current - BIRD_SIZE * 0.4 < 0) {
          birdY.current = BIRD_SIZE * 0.4
          birdVelocity.current = 0
        }
      } else if (gameOver.current) {
        // Spinning fall animation
        birdRotation.current += 0.15
        birdVelocity.current += GRAVITY * 0.5
        birdY.current = Math.min(birdY.current + birdVelocity.current, h - GROUND_HEIGHT - BIRD_SIZE * 0.4)
      } else {
        // Idle hover before start
        birdY.current = h * 0.4 + Math.sin(frameCount.current * 0.05) * 10
        birdRotation.current = 0
      }

      drawObstacles(ctx, h)
      drawGround(ctx, w, h)
      drawBird(ctx, birdY.current)

      if (started.current && !gameOver.current) {
        drawScore(ctx, w)
      }

      if (!started.current && !gameOver.current) {
        drawStartScreen(ctx, w, h)
      }

      animFrame.current = requestAnimationFrame(loop)
    }

    animFrame.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrame.current)
      resizeObserver.disconnect()
    }
  }, [isPlaying, drawBackground, drawDecorations, drawBird, drawObstacles, drawGround, drawScore, drawStartScreen, getGap, getSpeed, resetGame, onScore, onGameOver])

  // Reset on new game
  useEffect(() => {
    if (isPlaying) resetGame()
  }, [isPlaying, resetGame])

  // ── Input Handlers ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        flap()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [flap])

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    flap()
  }, [flap])

  return (
    <div className="relative w-full h-full select-none" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onMouseDown={handleTap}
        onTouchStart={handleTap}
      />
    </div>
  )
}
