import { useState, useRef, useCallback, useEffect } from 'react'
import { buildDeck, getCardSetCount, getCardSetName, getCardSetEmoji, type DeckCard } from './cards'
import { DIFFICULTY_LEVELS, type DifficultyLevel } from './difficulty'
import { playCardFlip, playMatch, playMismatch, playAllMatched } from '../sounds'

interface MemoryMatchProps {
  onScore: (score: number) => void
  onGameOver: (finalScore: number) => void
  isPlaying: boolean
  onStart: () => void
  highScore: number
}

function calculateScore(moves: number, elapsedSeconds: number, difficulty: DifficultyLevel): number {
  // Move score: more points for fewer moves
  const moveScore = Math.max(0, difficulty.maxMoves * 10 - moves * 5)
  // Time bonus: more points for faster completion
  const timeScore = Math.max(0, Math.floor((difficulty.timeBonus - elapsedSeconds) * 2))
  // Base points per pair found
  const pairBonus = difficulty.pairs * 5
  return moveScore + timeScore + pairBonus
}

export default function MemoryMatch({ onScore, onGameOver, isPlaying, onStart, highScore }: MemoryMatchProps) {
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null)
  const [cardSetIndex, setCardSetIndex] = useState(0)
  const [deck, setDeck] = useState<DeckCard[]>([])
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [moves, setMoves] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const isLocked = useRef(false)
  const firstFlipped = useRef<number | null>(null)
  const startTime = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset on new game
  useEffect(() => {
    if (isPlaying) {
      setDifficulty(null)
      setDeck([])
      setFlipped(new Set())
      setMatched(new Set())
      setMoves(0)
      setGameStarted(false)
      setGameFinished(false)
      setElapsed(0)
      isLocked.current = false
      firstFlipped.current = null
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying])

  // Timer
  useEffect(() => {
    if (gameStarted && !gameFinished) {
      startTime.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
      }, 1000)
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }, [gameStarted, gameFinished])

  const startGame = useCallback((diff: DifficultyLevel) => {
    setDifficulty(diff)
    setDeck(buildDeck(diff.pairs, cardSetIndex))
    setFlipped(new Set())
    setMatched(new Set())
    setMoves(0)
    setGameStarted(false)
    setGameFinished(false)
    setElapsed(0)
    isLocked.current = false
    firstFlipped.current = null
    onStart()
  }, [cardSetIndex, onStart])

  const handleCardClick = useCallback((uid: number) => {
    if (isLocked.current || gameFinished) return
    if (flipped.has(uid)) return

    const card = deck.find((c) => c.uid === uid)
    if (!card || matched.has(card.cardId)) return

    if (!gameStarted) {
      setGameStarted(true)
    }

    playCardFlip()

    if (firstFlipped.current === null) {
      // First card of pair
      firstFlipped.current = uid
      setFlipped(new Set([uid]))
    } else {
      // Second card
      const firstUid = firstFlipped.current
      const firstCard = deck.find((c) => c.uid === firstUid)!
      const newFlipped = new Set([firstUid, uid])
      setFlipped(newFlipped)
      setMoves((m) => m + 1)

      isLocked.current = true

      if (firstCard.cardId === card.cardId) {
        // Match!
        setTimeout(() => {
          playMatch()
          const newMatched = new Set(matched)
          newMatched.add(card.cardId)
          setMatched(newMatched)
          setFlipped(new Set())
          firstFlipped.current = null
          isLocked.current = false

          const newMoveCount = moves + 1
          const currentScore = newMatched.size * 10

          if (difficulty && newMatched.size === difficulty.pairs) {
            // Game complete!
            setGameFinished(true)
            if (timerRef.current) clearInterval(timerRef.current)
            const finalElapsed = Math.floor((Date.now() - startTime.current) / 1000)
            const finalScore = calculateScore(newMoveCount, finalElapsed, difficulty)
            playAllMatched()
            onScore(finalScore)
            setTimeout(() => onGameOver(finalScore), 800)
          } else {
            onScore(currentScore)
          }
        }, 400)
      } else {
        // No match
        setTimeout(() => {
          playMismatch()
          setFlipped(new Set())
          firstFlipped.current = null
          isLocked.current = false
        }, 800)
      }
    }
  }, [deck, flipped, matched, moves, difficulty, gameStarted, gameFinished, onScore, onGameOver])

  // Difficulty selection screen
  if (!difficulty) {
    const cardSetCount = getCardSetCount()
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-purple-600/20 via-indigo-500/10 to-blue-500/20 p-4">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">Memory Match</h2>
        {highScore > 0 && (
          <p className="text-sm text-muted-foreground mb-4">Best: {highScore}</p>
        )}

        {/* Card set selector */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: cardSetCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setCardSetIndex(i)}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                cardSetIndex === i
                  ? 'bg-purple-500 text-white scale-105'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {getCardSetEmoji(i)} {getCardSetName(i)}
            </button>
          ))}
        </div>

        {/* Difficulty buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {DIFFICULTY_LEVELS.map((diff) => (
            <button
              key={diff.name}
              onClick={() => startGame(diff)}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card/80 border-2 border-transparent hover:border-purple-400 hover:scale-105 active:scale-95 transition-all shadow-sm"
            >
              <span className="text-2xl">{diff.emoji}</span>
              <div className="text-left flex-1">
                <p className="font-extrabold text-foreground">{diff.name}</p>
                <p className="text-xs text-muted-foreground">{diff.cols}x{diff.rows} grid · {diff.pairs} pairs</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Game board
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-purple-600/20 via-indigo-500/10 to-blue-500/20">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-4 py-2 text-sm font-bold">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">Moves: <span className="text-foreground">{moves}</span></span>
          <span className="text-muted-foreground">Time: <span className="text-foreground">{formatTime(elapsed)}</span></span>
        </div>
        <span className="text-muted-foreground">
          {matched.size}/{difficulty.pairs} pairs
        </span>
      </div>

      {/* Card grid */}
      <div className="flex-1 flex items-center justify-center p-3">
        <div
          className="grid gap-2 w-full max-w-sm"
          style={{
            gridTemplateColumns: `repeat(${difficulty.cols}, 1fr)`,
            aspectRatio: `${difficulty.cols} / ${difficulty.rows}`,
          }}
        >
          {deck.map((card) => {
            const isFlipped = flipped.has(card.uid) || matched.has(card.cardId)
            const isMatched = matched.has(card.cardId)
            return (
              <button
                key={card.uid}
                onClick={() => handleCardClick(card.uid)}
                disabled={isMatched}
                className="relative w-full aspect-square"
                style={{ perspective: '600px' }}
              >
                <div
                  className={`absolute inset-0 transition-transform duration-500 ${
                    isFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front (face down) */}
                  <div
                    className={`absolute inset-0 rounded-xl flex items-center justify-center text-2xl font-bold
                      bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md
                      hover:from-purple-400 hover:to-indigo-500 active:scale-95 transition-colors cursor-pointer
                      ${isMatched ? 'opacity-0' : ''}
                    `}
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    ?
                  </div>
                  {/* Back (face up) */}
                  <div
                    className={`absolute inset-0 rounded-xl flex items-center justify-center text-3xl
                      bg-card border-2 shadow-md
                      ${isMatched ? 'border-green-400 bg-green-50 dark:bg-green-900/30' : 'border-purple-300'}
                      ${isMatched ? 'opacity-60' : ''}
                    `}
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    {card.emoji}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
