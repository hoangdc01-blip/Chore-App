import { useMemo } from 'react'
import { ACHIEVEMENTS } from '../../lib/achievements'
import { useAchievementStore } from '../../store/achievement-store'

// Stable empty array to avoid new reference on every render
const EMPTY_BADGES: string[] = []

interface BadgeGridProps {
  memberId: string
}

export default function BadgeGrid({ memberId }: BadgeGridProps) {
  const earnedBadgesMap = useAchievementStore((s) => s.earnedBadges)
  const earnedBadges = useMemo(() => earnedBadgesMap[memberId] ?? EMPTY_BADGES, [earnedBadgesMap, memberId])
  const earnedSet = new Set(earnedBadges)

  if (ACHIEVEMENTS.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-muted-foreground">Badges ({earnedBadges.length}/{ACHIEVEMENTS.length})</h4>
      <div className="flex flex-wrap gap-2">
        {ACHIEVEMENTS.map((achievement) => {
          const isEarned = earnedSet.has(achievement.id)
          return (
            <div
              key={achievement.id}
              title={isEarned ? `${achievement.name}: ${achievement.description}` : '???'}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                isEarned
                  ? 'bg-amber-100 dark:bg-amber-900/40 shadow-sm scale-100'
                  : 'bg-muted text-muted-foreground/30 grayscale'
              }`}
            >
              {isEarned ? achievement.emoji : '?'}
            </div>
          )
        })}
      </div>
    </div>
  )
}
