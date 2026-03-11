import { Star, Flame, CheckCircle } from 'lucide-react'
import type { KidStats, FamilyMember } from '../../types'
import { getMemberColor } from '../../store/member-store'

interface KidStatsCardProps {
  member: FamilyMember
  stats: KidStats
}

export default function KidStatsCard({ member, stats }: KidStatsCardProps) {
  const color = getMemberColor(member)

  return (
    <div className={`rounded-lg border border-border p-4 space-y-3 ${color.bg}`}>
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="h-14 w-14 sm:h-12 sm:w-12 rounded-full object-cover" />
        ) : (
          <div className={`h-14 w-14 sm:h-12 sm:w-12 rounded-full ${color.dot} flex items-center justify-center text-white text-lg font-bold`}>
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className={`font-semibold ${color.text}`}>{member.name}</h3>
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <Star size={14} fill="currentColor" />
            <span className="font-medium">{stats.totalPoints} points</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-green-600" />
            Completion
          </span>
          <span className="font-medium">{stats.completionRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <Flame size={14} className="text-orange-500" />
          Current streak
        </span>
        <span className="font-medium">{stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}</span>
      </div>

      <div className="text-xs text-muted-foreground">
        {stats.completedCount} of {stats.totalCount} chores done
      </div>
    </div>
  )
}
