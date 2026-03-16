import { Check, X, Clock } from 'lucide-react'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { fireConfetti } from '../../lib/confetti'

export default function PendingApprovals() {
  const chores = useChoreStore((s) => s.chores)
  const pendingApprovals = useChoreStore((s) => s.pendingApprovals)
  const approveChore = useChoreStore((s) => s.approveChore)
  const rejectChore = useChoreStore((s) => s.rejectChore)
  const members = useMemberStore((s) => s.members)

  const pendingKeys = Object.keys(pendingApprovals).filter((k) => pendingApprovals[k])
  if (pendingKeys.length === 0) return null

  const pendingItems = pendingKeys.map((key) => {
    const [choreId, memberId, date] = key.split(':')
    const chore = chores.find((c) => c.id === choreId)
    const member = members.find((m) => m.id === memberId)
    return { key, choreId, memberId, date, chore, member }
  }).filter((item) => item.chore && item.member)

  if (pendingItems.length === 0) return null

  const handleApprove = (item: typeof pendingItems[0]) => {
    fireConfetti()
    approveChore(item.choreId, item.memberId, item.date)
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
          <Clock size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Pending Approvals</h3>
          <p className="text-xs text-muted-foreground">{pendingItems.length} chore{pendingItems.length !== 1 ? 's' : ''} waiting for approval</p>
        </div>
      </div>

      <div className="space-y-2">
        {pendingItems.map((item) => {
          const color = item.member ? getMemberColor(item.member) : null
          return (
            <div
              key={item.key}
              className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5"
            >
              {item.member?.avatar ? (
                <img src={item.member.avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <span className={`h-8 w-8 rounded-full ${color?.dot ?? 'bg-muted-foreground'} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                  {item.member?.name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {item.chore?.emoji && <span className="mr-1">{item.chore.emoji}</span>}
                  {item.chore?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.member?.name} · {item.date} · {item.chore?.points} pts
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => handleApprove(item)}
                  className="h-9 w-9 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center justify-center transition-colors"
                  title="Approve"
                >
                  <Check size={18} strokeWidth={3} />
                </button>
                <button
                  onClick={() => rejectChore(item.choreId, item.memberId, item.date)}
                  className="h-9 w-9 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center transition-colors"
                  title="Reject"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
