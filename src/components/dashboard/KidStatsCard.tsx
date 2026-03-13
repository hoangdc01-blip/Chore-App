import { Star, Flame, CheckCircle } from 'lucide-react'
import type { KidStats, FamilyMember } from '../../types'
import { getLevel, STREAK_BADGES, countCompletionsForMember } from '../../types'
import { getMemberColor } from '../../store/member-store'
import { useChoreStore } from '../../store/chore-store'
import BadgeGrid from '../achievements/BadgeGrid'

interface KidStatsCardProps {
  member: FamilyMember
  stats: KidStats
}

export default function KidStatsCard({ member, stats }: KidStatsCardProps) {
  const completions = useChoreStore((s) => s.completions)
  const color = getMemberColor(member)
  const level = getLevel(member.points ?? 0)
  const earnedBadges = STREAK_BADGES.filter((b) => stats.currentStreak >= b.days)
  const choresDone = countCompletionsForMember(completions, member.id)

  return (
    <div className={`rounded-xl border-2 border-border p-4 space-y-3 ${color.bg}`}>
      <div className="flex items-center gap-3">
        {member.avatar ? (
          <img src={member.avatar} alt={member.name} className="h-14 w-14 xl:h-12 xl:w-12 rounded-full object-cover" />
        ) : (
          <div className={`h-14 w-14 xl:h-12 xl:w-12 rounded-full ${color.dot} flex items-center justify-center text-white text-lg font-bold`}>
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${color.text} truncate`}>{member.name}</h3>
            <span className="shrink-0 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 rounded-full px-2 py-0.5">
              Lv.{level.level} {level.title}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <Star size={14} fill="currentColor" />
            <span className="font-medium">{member.points ?? 0} points</span>
          </div>
        </div>
      </div>

      {/* Level progress */}
      {level.nextXp !== null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Next: Lv.{level.level + 1}</span>
            <span>{member.points ?? 0}/{level.nextXp} XP</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${Math.min(100, (((member.points ?? 0) - level.xp) / (level.nextXp - level.xp)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-green-600" />
            Completion
          </span>
          <span className="font-medium">{stats.completionRate}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
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
        <span className="font-medium flex items-center gap-1">
          <span className={stats.currentStreak >= 3 ? 'animate-pulse' : ''}>
            {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
          </span>
          {earnedBadges.length > 0 && (
            <span>
              {earnedBadges.map((b) => (
                <span key={b.days} title={b.label}>{b.emoji}</span>
              ))}
            </span>
          )}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        {choresDone} chores completed
      </div>

      <BadgeGrid memberId={member.id} />
    </div>
  )
}
