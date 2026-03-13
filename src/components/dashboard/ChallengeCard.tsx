import { useCallback } from 'react'
import { format } from 'date-fns'
import { Gift } from 'lucide-react'
import { getTodayChallenge, type ChallengeContext } from '../../lib/challenges'
import { useChallengeStore } from '../../store/challenge-store'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore } from '../../store/member-store'
import confetti from 'canvas-confetti'

interface ChallengeCardProps {
  memberId: string
  memberName?: string
}

export default function ChallengeCard({ memberId, memberName }: ChallengeCardProps) {
  const completions = useChoreStore((s) => s.completions)
  const hasClaimed = useChallengeStore((s) => s.hasClaimed)
  const claimBonus = useChallengeStore((s) => s.claimBonus)
  const adjustPoints = useMemberStore((s) => s.adjustPoints)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const challenge = getTodayChallenge()

  const ctx: ChallengeContext = { memberId, completions, todayStr }
  const progress = challenge.getProgress(ctx)
  const isComplete = progress >= challenge.target
  const claimed = hasClaimed(challenge.id, memberId, todayStr)

  const handleClaim = useCallback(() => {
    if (claimed || !isComplete) return
    claimBonus(challenge.id, memberId, todayStr)
    adjustPoints(memberId, challenge.bonusPoints)
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } })
  }, [claimed, isComplete, claimBonus, challenge, memberId, todayStr, adjustPoints])

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      isComplete
        ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
        : 'border-border bg-muted/50'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{challenge.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-foreground truncate">{memberName ? `${memberName}: ` : ''}{challenge.title}</h4>
            <span className="shrink-0 text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 rounded-full px-2 py-0.5">
              +{challenge.bonusPoints} pts
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{challenge.description}</p>
        </div>
        {isComplete && !claimed && (
          <button
            onClick={handleClaim}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <Gift size={14} /> Claim
          </button>
        )}
        {claimed && (
          <span className="shrink-0 text-xs font-bold text-green-600">Claimed!</span>
        )}
      </div>
      {/* Progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`}
            style={{ width: `${Math.min(100, (progress / challenge.target) * 100)}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {Math.min(progress, challenge.target)}/{challenge.target}
        </span>
      </div>
    </div>
  )
}
