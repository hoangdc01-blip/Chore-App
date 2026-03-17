import { useRef, useEffect, useCallback, useState } from 'react'
import { randomTheme, type DinoTheme } from './themes'
import { randomCharacter, type DinoCharacter } from './characters'
import { playJump, playMilestone, playGameOver } from '../sounds'

// ── Game Constants ──
const GRAVITY = 0.45
const JUMP_STRENGTH = -9
const GROUND_HEIGHT = 60
const PLAYER_WIDTH = 36
const PLAYER_HEIGHT = 40
const DUCK_HEIGHT = 22
const INITIAL_SPEED = 3
const MAX_SPEED = 7
const OBSTACLE_MIN_GAP = 200

interface Obstacle {
  x: number
  width: number
  height: number
  y: number // top of obstacle (from ground)
  type: 'cactus-small' | 'cactus-large' | 'cactus-cluster' | 'bird'
}

interface Cloud {
  x: number
  y: number
  size: number
  speed: number
}

interface DinoRunProps {
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
  isPlaying: boolean
  onStart: () => void
  highScore: number
}

export default function DinoRun({ onScore, onGameOver, isPlaying, onStart, highScore }: DinoRunProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [theme] = useState<DinoTheme>(() => randomTheme())
  const [character] = useState<DinoCharacter>(() => randomCharacter())

  // Game state refs
  const playerY = useRef(0) // distance from ground
  const playerVelocity = useRef(0)
  const isDucking = useRef(false)
  const isJumping = useRef(false)
  const obstacles = useRef<Obstacle[]>([])
  const clouds = useRef<Cloud[]>([])
  const score = useRef(0)
  const frameCount = useRef(0)
  const gameOver = useRef(false)
  const started = useRef(false)
  const animFrame = useRef(0)
  const speed = useRef(INITIAL_SPEED)
  const canvasSize = useRef({ w: 0, h: 0 })
  const groundOffset = useRef(0)
  const lastMilestone = useRef(0)
  const runFrame = useRef(0)

  const initClouds = useCallback((w: number, h: number) => {
    const result: Cloud[] = []
    for (let i = 0; i < 8; i++) {
      result.push({
        x: Math.random() * w * 2,
        y: Math.random() * (h * 0.5) + 20,
        size: Math.random() * 20 + 15,
        speed: Math.random() * 0.5 + 0.2,
      })
    }
    return result
  }, [])

  const resetGame = useCallback(() => {
    const { w, h } = canvasSize.current
    playerY.current = 0
    playerVelocity.current = 0
    isDucking.current = false
    isJumping.current = false
    obstacles.current = []
    clouds.current = initClouds(w, h)
    score.current = 0
    frameCount.current = 0
    gameOver.current = false
    started.current = false
    speed.current = INITIAL_SPEED
    groundOffset.current = 0
    lastMilestone.current = 0
    runFrame.current = 0
  }, [initClouds])

  const jump = useCallback(() => {
    if (gameOver.current) return
    if (!started.current) {
      started.current = true
      onStart()
    }
    if (playerY.current === 0 && !isJumping.current) {
      playerVelocity.current = JUMP_STRENGTH
      isJumping.current = true
      isDucking.current = false
      playJump()
    }
  }, [onStart])

  const duck = useCallback((down: boolean) => {
    if (gameOver.current) return
    if (!started.current && down) {
      started.current = true
      onStart()
    }
    isDucking.current = down && playerY.current === 0
  }, [onStart])

  const spawnObstacle = useCallback((w: number) => {
    const scoreVal = score.current
    const types: Obstacle['type'][] = ['cactus-small', 'cactus-large', 'cactus-cluster']
    // Birds appear after score > 5
    if (scoreVal > 5) types.push('bird')

    const type = types[Math.floor(Math.random() * types.length)]
    let width = 20
    let height = 40
    let y = 0 // distance from ground

    switch (type) {
      case 'cactus-small':
        width = 18
        height = 35
        break
      case 'cactus-large':
        width = 24
        height = 50
        break
      case 'cactus-cluster':
        width = 45
        height = 35
        break
      case 'bird':
        width = 30
        height = 20
        // Fly at a height the player must duck under
        y = PLAYER_HEIGHT + 5
        break
    }

    obstacles.current.push({ x: w + 20, width, height, y, type })
  }, [])

  // ── Drawing ──

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, theme.skyGradient[0])
    grad.addColorStop(1, theme.skyGradient[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }, [theme])

  const drawClouds = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = theme.cloudColor
    ctx.globalAlpha = 0.5
    for (const cloud of clouds.current) {
      ctx.beginPath()
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2)
      ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - cloud.size * 0.2, cloud.size * 0.6, 0, Math.PI * 2)
      ctx.arc(cloud.x + cloud.size * 1.3, cloud.y, cloud.size * 0.7, 0, Math.PI * 2)
      ctx.fill()

      cloud.x -= cloud.speed * speed.current * 0.3
      if (cloud.x < -cloud.size * 3) {
        cloud.x = w + cloud.size * 2
        cloud.y = Math.random() * (h * 0.4) + 20
      }
    }
    ctx.globalAlpha = 1
  }, [theme])

  const drawGround = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const groundY = h - GROUND_HEIGHT
    ctx.fillStyle = theme.groundColor
    ctx.fillRect(0, groundY, w, GROUND_HEIGHT)
    ctx.fillStyle = theme.groundAccent
    ctx.fillRect(0, groundY, w, 3)

    // Ground texture
    const offset = groundOffset.current % 30
    for (let x = -offset; x < w; x += 30) {
      ctx.fillStyle = theme.groundAccent
      ctx.fillRect(x, groundY + 8, 12, 2)
      ctx.fillRect(x + 15, groundY + 16, 8, 2)
    }
  }, [theme])

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, h: number) => {
    const groundY = h - GROUND_HEIGHT
    const ducking = isDucking.current
    const pHeight = ducking ? DUCK_HEIGHT : PLAYER_HEIGHT
    const px = 60
    const py = groundY - playerY.current - pHeight

    ctx.save()

    // Body
    ctx.fillStyle = character.bodyColor
    const bodyRadius = ducking ? 12 : 8
    const bodyW = ducking ? PLAYER_WIDTH + 8 : PLAYER_WIDTH
    const bodyH = pHeight
    ctx.beginPath()
    ctx.roundRect(px - bodyW / 2, py, bodyW, bodyH, bodyRadius)
    ctx.fill()

    // Belly
    ctx.fillStyle = character.bellyColor
    if (ducking) {
      ctx.beginPath()
      ctx.ellipse(px, py + bodyH * 0.5, bodyW * 0.3, bodyH * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.ellipse(px, py + bodyH * 0.6, bodyW * 0.25, bodyH * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Eye
    const eyeY = ducking ? py + bodyH * 0.35 : py + bodyH * 0.25
    const eyeX = px + bodyW * 0.2
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = character.eyeColor
    ctx.beginPath()
    ctx.arc(eyeX + 1.5, eyeY, 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Legs (running animation)
    if (!isJumping.current && !ducking) {
      const legPhase = runFrame.current % 2 === 0
      ctx.fillStyle = character.accentColor
      // Left leg
      ctx.fillRect(px - 6, py + bodyH, 5, legPhase ? 8 : 4)
      // Right leg
      ctx.fillRect(px + 2, py + bodyH, 5, legPhase ? 4 : 8)
    } else if (!ducking) {
      // Jumping legs tucked
      ctx.fillStyle = character.accentColor
      ctx.fillRect(px - 6, py + bodyH, 5, 4)
      ctx.fillRect(px + 2, py + bodyH, 5, 4)
    }

    ctx.restore()
  }, [character])

  const drawObstacles = useCallback((ctx: CanvasRenderingContext2D, h: number) => {
    const groundY = h - GROUND_HEIGHT

    for (const obs of obstacles.current) {
      ctx.fillStyle = theme.obstacleColor
      const obsY = groundY - obs.height - obs.y

      if (obs.type === 'bird') {
        // Bird body
        ctx.fillStyle = theme.obstacleAccent
        ctx.beginPath()
        ctx.ellipse(obs.x + obs.width / 2, obsY + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
        // Wings (flapping)
        const wingUp = frameCount.current % 20 < 10
        ctx.fillStyle = theme.obstacleColor
        ctx.beginPath()
        if (wingUp) {
          ctx.moveTo(obs.x + 5, obsY + obs.height / 2)
          ctx.lineTo(obs.x + obs.width / 2, obsY - 8)
          ctx.lineTo(obs.x + obs.width - 5, obsY + obs.height / 2)
        } else {
          ctx.moveTo(obs.x + 5, obsY + obs.height / 2)
          ctx.lineTo(obs.x + obs.width / 2, obsY + obs.height + 6)
          ctx.lineTo(obs.x + obs.width - 5, obsY + obs.height / 2)
        }
        ctx.fill()
        // Eye
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(obs.x + obs.width * 0.7, obsY + obs.height * 0.35, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.arc(obs.x + obs.width * 0.72, obsY + obs.height * 0.35, 1.5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Cactus
        ctx.fillStyle = theme.obstacleColor
        if (obs.type === 'cactus-cluster') {
          // Three cacti
          const cw = obs.width / 3 - 2
          ctx.fillRect(obs.x, obsY + 8, cw, obs.height - 8)
          ctx.fillRect(obs.x + cw + 4, obsY, cw, obs.height)
          ctx.fillRect(obs.x + cw * 2 + 8, obsY + 5, cw, obs.height - 5)
        } else {
          // Single cactus with arms
          const cw = obs.width
          ctx.fillRect(obs.x + cw * 0.3, obsY, cw * 0.4, obs.height)
          // Left arm
          ctx.fillRect(obs.x, obsY + obs.height * 0.3, cw * 0.35, cw * 0.2)
          ctx.fillRect(obs.x, obsY + obs.height * 0.15, cw * 0.2, cw * 0.35)
          // Right arm
          ctx.fillRect(obs.x + cw * 0.65, obsY + obs.height * 0.45, cw * 0.35, cw * 0.2)
          ctx.fillRect(obs.x + cw * 0.8, obsY + obs.height * 0.3, cw * 0.2, cw * 0.35)
        }
        // Accent highlights
        ctx.fillStyle = theme.obstacleAccent
        if (obs.type !== 'cactus-cluster') {
          ctx.fillRect(obs.x + obs.width * 0.35, obsY, obs.width * 0.1, obs.height)
        }
      }
    }
  }, [theme])

  const drawScore = useCallback((ctx: CanvasRenderingContext2D, w: number) => {
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.font = 'bold 24px Nunito, sans-serif'
    ctx.textAlign = 'right'
    const text = String(score.current)
    ctx.strokeText(text, w - 20, 40)
    ctx.fillText(text, w - 20, 40)

    if (highScore > 0) {
      ctx.font = 'bold 12px Nunito, sans-serif'
      ctx.lineWidth = 2
      const hsText = `HI ${highScore}`
      ctx.strokeText(hsText, w - 20, 58)
      ctx.fillStyle = '#FFD54F'
      ctx.fillText(hsText, w - 20, 58)
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

    ctx.font = 'bold 18px Nunito, sans-serif'
    ctx.fillStyle = '#FFD54F'
    ctx.fillText(`Theme: ${theme.name}`, w / 2, h * 0.42)

    if (highScore > 0) {
      ctx.font = 'bold 16px Nunito, sans-serif'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(`Best: ${highScore}`, w / 2, h * 0.49)
    }

    const bounce = Math.sin(frameCount.current * 0.08) * 8
    ctx.font = '16px Nunito, sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('Tap or press Space to start!', w / 2, h * 0.58 + bounce)
    ctx.font = '13px Nunito, sans-serif'
    ctx.fillStyle = '#CCCCCC'
    ctx.fillText('Down arrow or swipe down to duck', w / 2, h * 0.64 + bounce)

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

    const loop = () => {
      const { w, h } = canvasSize.current
      if (w === 0 || h === 0) {
        animFrame.current = requestAnimationFrame(loop)
        return
      }

      frameCount.current++
      if (frameCount.current % 6 === 0) runFrame.current++

      // Draw
      drawBackground(ctx, w, h)
      drawClouds(ctx, w, h)

      if (started.current && !gameOver.current) {
        // Speed increase
        speed.current = Math.min(MAX_SPEED, INITIAL_SPEED + score.current * 0.05)

        // Ground scrolling
        groundOffset.current += speed.current

        // Player physics
        if (isJumping.current) {
          playerVelocity.current += GRAVITY
          playerY.current -= playerVelocity.current

          if (playerY.current <= 0) {
            playerY.current = 0
            playerVelocity.current = 0
            isJumping.current = false
          }
        }

        // Spawn obstacles
        const lastObs = obstacles.current[obstacles.current.length - 1]
        const minSpacing = Math.max(OBSTACLE_MIN_GAP, 350 - score.current * 2)
        if (!lastObs || lastObs.x < w - minSpacing) {
          if (Math.random() < 0.02 + Math.min(score.current * 0.002, 0.04)) {
            spawnObstacle(w)
          }
        }

        // Move & check obstacles
        for (let i = obstacles.current.length - 1; i >= 0; i--) {
          const obs = obstacles.current[i]
          obs.x -= speed.current

          // Remove off-screen
          if (obs.x + obs.width < -10) {
            obstacles.current.splice(i, 1)
            continue
          }

          // Collision (AABB)
          const groundY = h - GROUND_HEIGHT
          const pDucking = isDucking.current
          const pH = pDucking ? DUCK_HEIGHT : PLAYER_HEIGHT
          const pW = pDucking ? PLAYER_WIDTH + 8 : PLAYER_WIDTH
          const px = 60 - pW / 2
          const py = groundY - playerY.current - pH

          const ox = obs.x
          const oy = groundY - obs.height - obs.y
          const ow = obs.width
          const oh = obs.height

          // Shrink hitboxes slightly for fairness
          const margin = 4
          if (
            px + pW - margin > ox + margin &&
            px + margin < ox + ow - margin &&
            py + pH - margin > oy + margin &&
            py + margin < oy + oh - margin
          ) {
            gameOver.current = true
            playGameOver()
            onGameOver(score.current)
          }
        }

        // Score
        if (frameCount.current % 8 === 0) {
          score.current++
          onScore(score.current)

          // Milestone sound
          if (score.current % 100 === 0 && score.current !== lastMilestone.current) {
            lastMilestone.current = score.current
            playMilestone()
          }
        }
      } else if (!started.current) {
        // Idle breathing
        playerY.current = Math.sin(frameCount.current * 0.05) * 3
      }

      drawGround(ctx, w, h)
      drawObstacles(ctx, h)
      drawPlayer(ctx, h)

      if (started.current) {
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
  }, [isPlaying, drawBackground, drawClouds, drawGround, drawObstacles, drawPlayer, drawScore, drawStartScreen, resetGame, spawnObstacle, onScore, onGameOver])

  // Reset on new game + auto-focus canvas for keyboard input
  useEffect(() => {
    if (isPlaying) {
      resetGame()
      // Focus canvas so keyboard events work immediately
      setTimeout(() => canvasRef.current?.focus(), 100)
    }
  }, [isPlaying, resetGame])

  // ── Input Handlers ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        // Directly manipulate refs to avoid stale closure
        if (gameOver.current) return
        if (!started.current) {
          started.current = true
          onStart()
        }
        if (playerY.current === 0 && !isJumping.current) {
          playerVelocity.current = JUMP_STRENGTH
          isJumping.current = true
          isDucking.current = false
          playJump()
        }
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        if (gameOver.current) return
        if (!started.current) {
          started.current = true
          onStart()
        }
        isDucking.current = true
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        isDucking.current = false
      }
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
    }
  }, [onStart])

  // Touch handlers
  const touchStartY = useRef(0)

  const doJump = useCallback(() => {
    console.log('[DINO] doJump called', { gameOver: gameOver.current, started: started.current, playerY: playerY.current, isJumping: isJumping.current })
    if (gameOver.current) { console.log('[DINO] blocked: game over'); return }
    if (!started.current) {
      started.current = true
      onStart()
      console.log('[DINO] game started')
    }
    if (playerY.current === 0 && !isJumping.current) {
      playerVelocity.current = JUMP_STRENGTH
      isJumping.current = true
      isDucking.current = false
      playJump()
      console.log('[DINO] jumping!')
    }
  }, [onStart])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    touchStartY.current = e.touches[0].clientY
    doJump()
  }, [doJump])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartY.current
    if (dy > 30) {
      isDucking.current = true
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isDucking.current = false
  }, [])

  return (
    <div className="relative w-full h-full select-none" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => doJump()}
        onMouseDown={(e) => { e.preventDefault(); doJump() }}
        tabIndex={0}
        onKeyDown={(e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); doJump() } }}
      />
    </div>
  )
}
