import { useState } from 'react'
import { Plus, Trash2, Star } from 'lucide-react'
import { useRewardStore } from '../../store/reward-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { fireConfetti } from '../../lib/confetti'
import { showToast } from '../../store/toast-store'
import RewardDialog from './RewardDialog'

export default function RewardShop() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const rewards = useRewardStore((s) => s.rewards)
  const redeemReward = useRewardStore((s) => s.redeemReward)
  const removeReward = useRewardStore((s) => s.removeReward)
  const members = useMemberStore((s) => s.members)

  const getAvailablePoints = (memberId: string) => {
    const member = members.find((m) => m.id === memberId)
    return member?.points ?? 0
  }

  const handleRedeem = (rewardId: string) => {
    if (!selectedMemberId) {
      showToast('Select a kid first!', 'info')
      return
    }
    const reward = rewards.find((r) => r.id === rewardId)
    if (!reward) return
    const available = getAvailablePoints(selectedMemberId)
    if (available < reward.cost) {
      showToast('Not enough points!', 'error')
      return
    }
    redeemReward(rewardId, selectedMemberId)
    fireConfetti()
    const member = members.find((m) => m.id === selectedMemberId)
    showToast(`${member?.name} redeemed ${reward.emoji} ${reward.name}!`, 'success')
  }

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      removeReward(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 xl:p-6 space-y-4 xl:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reward Shop</h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px]"
        >
          <Plus size={16} />
          Add Reward
        </button>
      </div>

      {/* Kid selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Select a kid to redeem:</p>
        <div className="flex gap-2 flex-wrap">
          {members.map((member) => {
            const color = getMemberColor(member)
            const pts = getAvailablePoints(member.id)
            const isSelected = selectedMemberId === member.id
            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(isSelected ? null : member.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all min-h-[48px] border-2 ${
                  isSelected
                    ? `${color.bg} ${color.text} ${color.border} shadow-md scale-105`
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className={`h-8 w-8 rounded-full ${color.dot} text-white text-xs font-bold flex items-center justify-center`}>
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="text-left">
                  <div>{member.name}</div>
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                    <Star size={10} fill="currentColor" />
                    {pts} pts
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Reward cards */}
      {rewards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">🎁</p>
          <p>No rewards yet. Add some rewards for your kids!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {rewards.map((reward) => {
            const canAfford = selectedMemberId ? getAvailablePoints(selectedMemberId) >= reward.cost : false
            return (
              <div
                key={reward.id}
                className="relative rounded-xl border-2 border-border p-4 flex flex-col items-center gap-2 text-center hover:border-primary/30 transition-colors"
              >
                <button
                  onClick={() => handleDelete(reward.id)}
                  className={`absolute top-2 right-2 p-1 rounded transition-colors ${
                    confirmDeleteId === reward.id
                      ? 'text-destructive bg-destructive/10'
                      : 'text-muted-foreground/40 hover:text-destructive'
                  }`}
                  title={confirmDeleteId === reward.id ? 'Click again to confirm' : 'Delete reward'}
                >
                  <Trash2 size={14} />
                </button>
                <span className="text-4xl">{reward.emoji}</span>
                <span className="font-semibold text-sm">{reward.name}</span>
                <span className="flex items-center gap-0.5 text-sm text-amber-600 font-medium">
                  <Star size={12} fill="currentColor" />
                  {reward.cost} pts
                </span>
                <button
                  onClick={() => handleRedeem(reward.id)}
                  disabled={!selectedMemberId || !canAfford}
                  className="w-full mt-1 rounded-lg bg-green-600 text-white px-3 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  {!selectedMemberId ? 'Select a kid' : canAfford ? 'Redeem!' : 'Not enough pts'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <RewardDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
