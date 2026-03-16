import { useState, useCallback, useRef, useEffect } from 'react'
import { Music, Play, Star, X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { playCorrect, playWrong } from '@/games/sounds'

// ── Audio helpers ──

let audioCtx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playNote(freq: number, duration: number, delay = 0) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.3, ctx.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration)
}

// Musical notes (C major scale, octave 4-5)
const NOTES: Record<string, number> = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
}

const NOTE_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
const NOTE_COLORS = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-teal-400', 'bg-blue-400', 'bg-indigo-400', 'bg-purple-400']
const NOTE_LABELS = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do\u266A']

// ── Lesson data ──

interface MusicLesson {
  name: string
  emoji: string
  description: string
  sequence: string[] // note names
  speed: number // ms between notes
}

const LESSONS: MusicLesson[] = [
  { name: 'First Steps', emoji: '\uD83D\uDC76', description: 'Two simple notes', sequence: ['C4', 'E4', 'C4', 'E4'], speed: 800 },
  { name: 'Three Notes', emoji: '\uD83C\uDF92', description: 'Do Re Mi', sequence: ['C4', 'D4', 'E4', 'E4', 'D4', 'C4'], speed: 700 },
  { name: 'Going Up', emoji: '\uD83D\uDCC8', description: 'Climb the scale', sequence: ['C4', 'D4', 'E4', 'F4', 'G4'], speed: 600 },
  { name: 'Going Down', emoji: '\uD83D\uDCC9', description: 'Come back down', sequence: ['G4', 'F4', 'E4', 'D4', 'C4'], speed: 600 },
  { name: 'Happy Song', emoji: '\uD83D\uDE0A', description: 'A cheerful tune', sequence: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4'], speed: 500 },
  { name: 'Little Star', emoji: '\u2B50', description: 'Twinkle Twinkle', sequence: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'], speed: 500 },
  { name: 'Jump Around', emoji: '\uD83D\uDC38', description: 'Big leaps!', sequence: ['C4', 'G4', 'E4', 'C5', 'G4', 'C4'], speed: 600 },
  { name: 'Fast Fingers', emoji: '\u26A1', description: 'Speed it up!', sequence: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'], speed: 400 },
]

type GameState = 'menu' | 'listening' | 'playing' | 'result'

export default function MusicTeacher({ onQuit }: { onQuit: () => void }) {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [currentLesson, setCurrentLesson] = useState<MusicLesson | null>(null)
  const [activeNoteIndex, setActiveNoteIndex] = useState(-1)
  const [_playerSequence, setPlayerSequence] = useState<string[]>([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [showNoteFlash, setShowNoteFlash] = useState<string | null>(null)
  const [results, setResults] = useState<boolean[]>([])
  const timeoutRefs = useRef<number[]>([])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => timeoutRefs.current.forEach(clearTimeout)
  }, [])

  const startLesson = useCallback((lesson: MusicLesson) => {
    setCurrentLesson(lesson)
    setPlayerSequence([])
    setCurrentPlayerIndex(0)
    setResults([])
    setScore(0)
    setGameState('listening')

    // Play the demo sequence
    lesson.sequence.forEach((note, i) => {
      const t = window.setTimeout(() => {
        playNote(NOTES[note], 0.4)
        setActiveNoteIndex(i)
      }, i * lesson.speed)
      timeoutRefs.current.push(t)
    })

    // After demo, switch to player mode
    const endT = window.setTimeout(() => {
      setActiveNoteIndex(-1)
      setGameState('playing')
    }, lesson.sequence.length * lesson.speed + 500)
    timeoutRefs.current.push(endT)
  }, [])

  const handleNotePress = useCallback((noteName: string) => {
    if (gameState !== 'playing' || !currentLesson) return

    playNote(NOTES[noteName], 0.3)
    setShowNoteFlash(noteName)
    setTimeout(() => setShowNoteFlash(null), 200)

    const expected = currentLesson.sequence[currentPlayerIndex]
    const isCorrect = noteName === expected

    const newResults = [...results, isCorrect]
    setResults(newResults)

    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    const nextIndex = currentPlayerIndex + 1
    setCurrentPlayerIndex(nextIndex)

    if (nextIndex >= currentLesson.sequence.length) {
      // Lesson complete
      const finalScore = newResults.filter(Boolean).length
      if (finalScore >= currentLesson.sequence.length * 0.7) {
        playCorrect()
      } else {
        playWrong()
      }
      setTimeout(() => setGameState('result'), 500)
    }
  }, [gameState, currentLesson, currentPlayerIndex, results])

  const replayDemo = useCallback(() => {
    if (!currentLesson) return
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
    setGameState('listening')
    setPlayerSequence([])
    setCurrentPlayerIndex(0)
    setResults([])

    currentLesson.sequence.forEach((note, i) => {
      const t = window.setTimeout(() => {
        playNote(NOTES[note], 0.4)
        setActiveNoteIndex(i)
      }, i * currentLesson.speed)
      timeoutRefs.current.push(t)
    })

    const endT = window.setTimeout(() => {
      setActiveNoteIndex(-1)
      setGameState('playing')
    }, currentLesson.sequence.length * currentLesson.speed + 500)
    timeoutRefs.current.push(endT)
  }, [currentLesson])

  // ── Menu ──
  if (gameState === 'menu') {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <button onClick={onQuit} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
            <X size={18} />
          </button>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Music size={20} className="text-primary" />
            Music Teacher
          </h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-center text-muted-foreground mb-4">
              Listen to the melody, then play it back!
            </p>
            {LESSONS.map((lesson, i) => (
              <button
                key={i}
                onClick={() => startLesson(lesson)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-md transition-all text-left"
              >
                <span className="text-3xl">{lesson.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{lesson.name}</p>
                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{lesson.sequence.length} notes</p>
                </div>
                <Play size={20} className="text-primary" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Result ──
  if (gameState === 'result' && currentLesson) {
    const total = currentLesson.sequence.length
    const pct = Math.round((score / total) * 100)
    const stars = pct >= 100 ? 5 : pct >= 80 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1
    const message = pct === 100 ? 'Perfect!' : pct >= 80 ? 'Amazing!' : pct >= 60 ? 'Great job!' : pct >= 40 ? 'Good try!' : 'Keep practicing!'

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
        <h2 className="text-3xl font-extrabold text-foreground">{message}</h2>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={32} className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-muted'} />
          ))}
        </div>
        <p className="text-xl font-bold">{score} / {total} notes correct</p>

        {/* Show which notes were right/wrong */}
        <div className="flex gap-1 flex-wrap justify-center">
          {results.map((correct, i) => (
            <div
              key={i}
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                correct ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
              )}
            >
              {NOTE_LABELS[NOTE_NAMES.indexOf(currentLesson.sequence[i])]}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={replayDemo} className="flex items-center gap-2 px-5 py-3 rounded-full bg-muted text-foreground font-bold">
            <RotateCcw size={16} />
            Try Again
          </button>
          <button onClick={() => setGameState('menu')} className="px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold">
            More Lessons
          </button>
        </div>
      </div>
    )
  }

  // ── Listening / Playing ──
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <button onClick={() => { timeoutRefs.current.forEach(clearTimeout); setGameState('menu') }} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
          <X size={18} />
        </button>
        <div className="text-center">
          <p className="font-bold text-foreground text-sm">{currentLesson?.name}</p>
          <p className="text-xs text-muted-foreground">
            {gameState === 'listening' ? 'Listen carefully...' : `Your turn! ${currentPlayerIndex}/${currentLesson?.sequence.length}`}
          </p>
        </div>
        <button onClick={replayDemo} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" title="Replay">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Note sequence visualization */}
      <div className="px-4 py-3 flex gap-1 justify-center flex-wrap">
        {currentLesson?.sequence.map((note, i) => {
          const noteIdx = NOTE_NAMES.indexOf(note)
          const isActive = gameState === 'listening' && i === activeNoteIndex
          const isPlayed = gameState === 'playing' && i < currentPlayerIndex
          const isCurrent = gameState === 'playing' && i === currentPlayerIndex
          const wasCorrect = results[i]

          return (
            <div
              key={i}
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all',
                isActive && `${NOTE_COLORS[noteIdx]} text-white scale-125 shadow-lg`,
                isPlayed && wasCorrect && 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
                isPlayed && !wasCorrect && 'bg-rose-200 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
                isCurrent && 'bg-primary/20 text-primary ring-2 ring-primary',
                !isActive && !isPlayed && !isCurrent && 'bg-muted text-muted-foreground',
              )}
            >
              {NOTE_LABELS[noteIdx]}
            </div>
          )
        })}
      </div>

      {/* Piano keys */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex gap-1.5 sm:gap-2">
          {NOTE_NAMES.map((note, i) => (
            <button
              key={note}
              onClick={() => handleNotePress(note)}
              disabled={gameState !== 'playing'}
              className={cn(
                'w-10 sm:w-14 h-32 sm:h-40 rounded-2xl flex flex-col items-center justify-end pb-3 gap-1 transition-all font-bold text-sm shadow-md',
                showNoteFlash === note && 'scale-95 brightness-110',
                gameState === 'playing'
                  ? `${NOTE_COLORS[i]} text-white hover:scale-105 active:scale-95 cursor-pointer`
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
              )}
            >
              <span>{NOTE_LABELS[i]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
