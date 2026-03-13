import { useState, useMemo } from 'react'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore } from '../../store/member-store'
import { computeAllKidsStats, getWeekRange, getMonthRange } from '../../lib/stats'
import Leaderboard from './Leaderboard'
import KidStatsCard from './KidStatsCard'
import PendingApprovals from './PendingApprovals'
import ChallengeCard from './ChallengeCard'

type Period = 'week' | 'month'

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>('week')
  const members = useMemberStore((s) => s.members)
  const chores = useChoreStore((s) => s.chores)
  const completions = useChoreStore((s) => s.completions)
  const skipped = useChoreStore((s) => s.skipped)

  const stats = useMemo(() => {
    const range = period === 'week' ? getWeekRange() : getMonthRange()
    return computeAllKidsStats(
      members.map((m) => m.id),
      chores,
      completions,
      skipped,
      range.start,
      range.end,
    )
  }, [members, chores, completions, skipped, period])

  const memberMap = new Map(members.map((m) => [m.id, m]))

  return (
    <div className="flex-1 overflow-y-auto p-4 xl:p-6 space-y-4 xl:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Dashboard</h2>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => setPeriod('week')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
              period === 'week'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors min-h-[36px] ${
              period === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <PendingApprovals />

      {/* Daily Challenges */}
      {members.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Today's Challenge</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {members.map((m) => (
              <ChallengeCard key={m.id} memberId={m.id} memberName={m.name} />
            ))}
          </div>
        </div>
      )}

      <Leaderboard members={members} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const member = memberMap.get(stat.memberId)
          if (!member) return null
          return <KidStatsCard key={stat.memberId} member={member} stats={stat} />
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          Add some kids in the sidebar to get started!
        </div>
      )}
    </div>
  )
}
