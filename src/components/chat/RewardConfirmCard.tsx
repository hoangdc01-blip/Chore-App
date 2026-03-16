import { Check, X } from 'lucide-react'
import type { RewardAction } from '../../types'
import { getMemberNameById } from '../../lib/chat-actions'
import { useMemberStore } from '../../store/member-store'

interface Props {
  action: RewardAction
  onAccept: () => void
  onCancel: () => void
}

export default function RewardConfirmCard({ action, onAccept, onCancel }: Props) {
  const memberName = getMemberNameById(action.memberId)
  const member = useMemberStore((s) => s.members.find((m) => m.id === action.memberId))
  const currentPoints = member?.points ?? 0
  const pointsAfter = currentPoints - action.cost

  return (
    <div className="bg-card border border-border rounded-2xl p-3 mb-3 ml-10 animate-fade-in-up">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
        Redeem Reward
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{action.rewardEmoji}</span>
        <span className="font-bold text-foreground">{action.rewardName}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <span>{'👤'}</span> {memberName}
        </div>
        <div className="flex items-center gap-1">
          <span>{'⭐'}</span> {action.cost} {action.cost === 1 ? 'point' : 'points'}
        </div>
        <div className="flex items-center gap-1">
          <span>{'💰'}</span> {currentPoints} {'→'} {pointsAfter} pts
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 text-sm font-bold transition-colors"
        >
          <Check size={14} /> Get it!
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-border hover:bg-muted text-foreground py-2 text-sm font-medium transition-colors"
        >
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  )
}
