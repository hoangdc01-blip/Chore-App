import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, RotateCcw, Trophy, Star, Lock } from 'lucide-react'
import { useGameStore } from './game-store'
import { useMemberStore } from '../store/member-store'
import { useChoreStore } from '../store/chore-store'
import { useAppStore } from '../store/app-store'
import { playHighScore, playBonusPoints } from './sounds'
import { format } from 'date-fns'
import confetti from 'canvas-confetti'

export const PARENT_PLAYERS = [
  { id: 'parent:mom', name: 'Mom', emoji: '\u{1F469}' },
  { id: 'parent:dad', name: 'Dad', emoji: '\u{1F468}' },
]

const ENCOURAGING_MESSAGES = [
  'Great job! 🎉',
  'Amazing! 🌟',
  'So close! 💪',
  'Try again! 🚀',
  'Almost there! ⭐',
  'You rock! 🎸',
  'Keep going! 🔥',
  'Awesome try! 👏',
]

function getEncouragingMessage() {
  return ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]
}

function getBonusPoints(score: number): number {
  if (score >= 30) return 5
  if (score >= 15) return 3
  if (score >= 5) return 1
  return 0
}

interface GameWrapperProps {
  gameName: string
  gameId: string
  onBack: () => void
  onNavigateToChores: () => void
  children: (props: {
    onScore: (score: number) => void
    onGameOver: (finalScore: number) => void
    isPlaying: boolean
    onStart: () => void
    highScore: number
  }) => React.ReactNode
}

export default function GameWrapper({ gameName, gameId, onBack, onNavigateToChores, children }: GameWrapperProps) {
  const appMode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    appMode === 'kid' ? activeKidId : null
  )
  const [isPlaying, setIsPlaying] = useState(appMode === 'kid')
  const [gameOverState, setGameOverState] = useState<{
    score: number
    highScore: number
    isNewHighScore: boolean
    bonusPoints: number
    message: string
  } | null>(null)
  const [, setCurrentScore] = useState(0)

  const members = useMemberStore((s) => s.members)
  const completions = useChoreStore((s) => s.completions)
  const { getHighScore, saveHighScore, canClaimBonus, claimBonus, loadHighScores, getLeaderboard } = useGameStore()

  useEffect(() => {
    loadHighScores()
  }, [loadHighScores])

  const today = format(new Date(), 'yyyy-MM-dd')

  // Check if member has completed at least 1 chore today
  const hasCompletedChoreToday = useCallback((memberId: string) => {
    for (const key of Object.keys(completions)) {
      if (completions[key] && key.includes(`:${memberId}:${today}`)) {
        return true
      }
    }
    return false
  }, [completions, today])

  const isParent = appMode === 'parent'
  const isParentPlayer = selectedMemberId?.startsWith('parent:') ?? false
  const isUnlocked = isParent || isParentPlayer || (selectedMemberId ? hasCompletedChoreToday(selectedMemberId) : false)

  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return ''
    const parentPlayer = PARENT_PLAYERS.find(p => p.id === playerId)
    if (parentPlayer) return parentPlayer.name
    return members.find(m => m.id === playerId)?.name ?? ''
  }

  const handleScore = useCallback((score: number) => {
    setCurrentScore(score)
  }, [])

  const handleGameOver = useCallback((finalScore: number) => {
    if (!selectedMemberId) return
    const playerName = getPlayerName(selectedMemberId)
    if (!playerName) return

    const isParentId = selectedMemberId.startsWith('parent:')
    const prevHigh = getHighScore(gameId, selectedMemberId)
    const isNewHigh = finalScore > prevHigh

    // Calculate bonus points (no bonus for parent players)
    let bonus = isParentId ? 0 : getBonusPoints(finalScore)
    if (!isParentId && isNewHigh) bonus += 10
    const willClaimBonus = bonus > 0 && !isParentId && canClaimBonus(selectedMemberId)

    if (isNewHigh && finalScore > 0) {
      saveHighScore({
        memberId: selectedMemberId,
        memberName: playerName,
        score: finalScore,
        game: gameId,
        date: today,
      })
      playHighScore()
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }

    if (willClaimBonus && bonus > 0) {
      claimBonus(selectedMemberId)
      useMemberStore.getState().adjustPoints(selectedMemberId, bonus)
      playBonusPoints()
    }

    setGameOverState({
      score: finalScore,
      highScore: Math.max(finalScore, prevHigh),
      isNewHighScore: isNewHigh && finalScore > 0,
      bonusPoints: willClaimBonus ? bonus : 0,
      message: getEncouragingMessage(),
    })
  }, [selectedMemberId, members, getHighScore, gameId, canClaimBonus, saveHighScore, claimBonus, today])

  const handleStart = useCallback(() => {
    setGameOverState(null)
    setCurrentScore(0)
  }, [])

  const handlePlayAgain = () => {
    setGameOverState(null)
    setCurrentScore(0)
    setIsPlaying(false)
    // Force re-mount by toggling isPlaying
    setTimeout(() => setIsPlaying(true), 50)
  }

  // ── Kid Selection Screen ──
  if (!selectedMemberId) {
    const leaderboard = getLeaderboard(gameId)
    return (
      <div className="fixed inset-0 z-50 bg-background flex justify-center">
        <div className="w-full max-w-[500px] h-full flex flex-col bg-gradient-to-b from-purple-500/20 via-pink-500/10 to-blue-500/20">
          <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <button onClick={onBack} className="rounded-lg p-2 hover:bg-muted transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {gameName}
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-6">
            <h3 className="text-lg font-bold text-foreground">Who's playing?</h3>

            {/* Parents section */}
            {isParent && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Parents</p>
                <div className="flex gap-3 justify-center">
                  {PARENT_PLAYERS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedMemberId(p.id)
                        setIsPlaying(true)
                      }}
                      className="flex flex-col items-center gap-2 rounded-xl border-2 border-border hover:border-primary/50 px-5 py-4 transition-all hover:scale-105 min-w-[100px]"
                    >
                      <span className="text-4xl">{p.emoji}</span>
                      <span className="text-sm font-semibold text-foreground">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kids section */}
            <div className="w-full max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Kids</p>
              <div className="grid grid-cols-2 gap-4 w-full">
                {members.map((member) => {
                  const unlocked = isParent || hasCompletedChoreToday(member.id)
                  return (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberId(member.id)
                        setIsPlaying(true)
                      }}
                      className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                        unlocked
                          ? 'border-purple-400 bg-card shadow-md hover:scale-105 hover:shadow-lg active:scale-95'
                          : 'border-border bg-muted opacity-70'
                      }`}
                    >
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl">
                          <Lock size={24} className="text-neutral-500" />
                        </div>
                      )}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold shadow-md">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="font-bold text-foreground">{member.name}</span>
                      {unlocked ? (
                        <span className="text-xs text-green-600 font-medium">Ready to play!</span>
                      ) : (
                        <span className="text-xs text-neutral-500 font-medium">Complete 1 chore first</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="w-full max-w-sm mt-4">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500" /> Top Scores
                </h3>
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                  {leaderboard.slice(0, 5).map((entry, i) => (
                    <div
                      key={`${entry.memberId}-${i}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
                    >
                      <span className="text-lg font-bold w-6 text-center">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </span>
                      <span className="font-semibold flex-1">{entry.memberName}</span>
                      <span className="font-bold text-purple-600">{entry.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Lock Screen ──
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex justify-center">
        <div className="w-full max-w-[500px] h-full flex flex-col bg-muted">
          <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <button onClick={() => setSelectedMemberId(null)} className="rounded-lg p-2 hover:bg-muted transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-extrabold">{gameName}</h2>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
              <Lock size={40} className="text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-extrabold text-foreground">Game Locked!</h3>
            <p className="text-lg text-muted-foreground max-w-xs">
              Complete at least 1 chore today to unlock this game!
            </p>
            <button
              onClick={onNavigateToChores}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 transition-opacity"
            >
              Go to Chores
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Game Screen ──
  return (
    <div className="fixed inset-0 z-50 bg-black flex justify-center">
      <div className="relative w-full max-w-[500px] h-full flex flex-col">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3">
          <button
            onClick={() => {
              setSelectedMemberId(null)
              setIsPlaying(false)
              setGameOverState(null)
            }}
            className="rounded-full p-2 bg-black/40 text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm font-bold">
            {getPlayerName(selectedMemberId)}
          </div>
        </div>

        {/* Game canvas — fills remaining space */}
        <div className="flex-1 relative overflow-hidden">
          {children({
            onScore: handleScore,
            onGameOver: handleGameOver,
            isPlaying,
            onStart: handleStart,
            highScore: selectedMemberId ? getHighScore(gameId, selectedMemberId) : 0,
          })}
        </div>

        {/* Game Over Overlay */}
        {gameOverState && (() => {
          const leaderboard = getLeaderboard(gameId)
          return (
            <div className="absolute inset-0 z-20 flex flex-col bg-black/50 backdrop-blur-sm">
              <div className="flex-1 overflow-auto flex flex-col items-center px-4 py-6">
                <div className="bg-card rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-[slideUp_0.3s_ease-out]">
                  {/* Title */}
                  <p className="text-2xl font-extrabold mb-1">{gameOverState.message}</p>

                  {gameOverState.isNewHighScore && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full px-4 py-1 text-sm font-bold inline-block mb-3 animate-bounce">
                      New High Score!
                    </div>
                  )}

                  {/* Score + Best */}
                  <div className="flex justify-center gap-8 my-4">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-foreground">{gameOverState.score}</span>
                      <span className="text-sm text-muted-foreground font-medium">Score</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-4xl font-extrabold text-purple-600 flex items-center gap-1">
                        <Trophy size={24} /> {gameOverState.highScore}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">Best</span>
                    </div>
                  </div>

                  {/* Bonus Points */}
                  {gameOverState.bonusPoints > 0 && (
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl px-4 py-3 mb-4 flex items-center justify-center gap-2">
                      <Star size={20} className="animate-spin" style={{ animationDuration: '3s' }} />
                      <span className="font-bold text-lg">+{gameOverState.bonusPoints} bonus points!</span>
                    </div>
                  )}

                  {!isParentPlayer && !canClaimBonus(selectedMemberId!) && gameOverState.bonusPoints === 0 && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Daily bonus limit reached (3/3)
                    </p>
                  )}

                  {/* Leaderboard */}
                  {leaderboard.length > 0 && (
                    <div className="mt-2 mb-4 text-left">
                      <h3 className="text-base font-extrabold text-foreground mb-2 flex items-center gap-1.5 justify-center">
                        Leaderboard <span className="text-lg">🏆</span>
                      </h3>
                      <div className="bg-muted/50 rounded-xl overflow-hidden border border-border">
                        {leaderboard.map((entry, i) => (
                          <div
                            key={entry.memberId}
                            className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-border last:border-0 ${
                              entry.memberId === selectedMemberId
                                ? 'bg-purple-100 dark:bg-purple-900/30'
                                : ''
                            }`}
                          >
                            <span className="text-base font-bold w-7 text-center shrink-0">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                            </span>
                            <span className={`font-semibold flex-1 truncate ${
                              entry.memberId === selectedMemberId ? 'text-purple-700 dark:text-purple-300' : 'text-foreground'
                            }`}>
                              {entry.memberName}
                              {entry.memberId === selectedMemberId && ' (you)'}
                            </span>
                            <span className={`font-bold tabular-nums ${
                              entry.memberId === selectedMemberId ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
                            }`}>
                              {entry.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedMemberId(null)
                        setIsPlaying(false)
                        setGameOverState(null)
                      }}
                      className="flex-1 px-4 py-3 rounded-xl border-2 border-border font-bold text-foreground hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePlayAgain}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={18} /> Play Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
