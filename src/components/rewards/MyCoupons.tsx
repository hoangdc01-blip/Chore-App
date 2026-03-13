import { Ticket, Check } from 'lucide-react'
import { useRewardStore } from '../../store/reward-store'
import { useAppStore } from '../../store/app-store'
import { useMemberStore } from '../../store/member-store'

export default function MyCoupons() {
  const coupons = useRewardStore((s) => s.coupons)
  const markCouponUsed = useRewardStore((s) => s.markCouponUsed)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const mode = useAppStore((s) => s.mode)
  const members = useMemberStore((s) => s.members)

  // Filter coupons: kid mode shows only their coupons, parent mode shows all
  const filteredCoupons = mode === 'kid' && activeKidId
    ? coupons.filter((c) => c.memberId === activeKidId)
    : coupons

  const sortedCoupons = [...filteredCoupons].sort((a, b) => {
    // Unused first, then by date descending
    if (a.used !== b.used) return a.used ? 1 : -1
    return new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  })

  const getMemberName = (memberId: string) =>
    members.find((m) => m.id === memberId)?.name ?? 'Unknown'

  if (sortedCoupons.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 pb-20 xl:p-6 xl:pb-20">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Ticket size={20} /> My Coupons
        </h2>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-4xl mb-2">🎟️</p>
          <p>No coupons yet! Redeem rewards to get coupons.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20 xl:p-6 xl:pb-20">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Ticket size={20} /> My Coupons
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sortedCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all ${
              coupon.used
                ? 'border-border opacity-60'
                : 'border-purple-300 dark:border-purple-700 shadow-md'
            }`}
          >
            {/* Ticket top section */}
            <div className={`px-5 py-4 ${
              coupon.used
                ? 'bg-muted'
                : 'bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{coupon.rewardEmoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-lg truncate">{coupon.rewardName}</p>
                  {mode === 'parent' && (
                    <p className="text-xs text-muted-foreground">For: {getMemberName(coupon.memberId)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Perforated divider */}
            <div className="relative h-0 border-t-2 border-dashed border-border mx-2">
              <div className="absolute -left-4 -top-3 w-6 h-6 rounded-full bg-background" />
              <div className="absolute -right-4 -top-3 w-6 h-6 rounded-full bg-background" />
            </div>

            {/* Ticket bottom section */}
            <div className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {new Date(coupon.redeemedAt).toLocaleDateString()}
                </p>
                <p className={`text-sm font-bold ${coupon.used ? 'text-muted-foreground' : 'text-green-600 dark:text-green-400'}`}>
                  {coupon.used ? 'Used' : 'Not Used'}
                </p>
              </div>

              {!coupon.used && mode === 'parent' && (
                <button
                  onClick={() => markCouponUsed(coupon.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  <Check size={14} strokeWidth={3} />
                  Mark Used
                </button>
              )}

              {coupon.used && (
                <div className="text-3xl opacity-30 font-black text-muted-foreground rotate-[-12deg]">
                  USED
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
