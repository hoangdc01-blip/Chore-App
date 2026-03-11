import { useMemo } from 'react'
import { Trophy, Star } from 'lucide-react'
import type { FamilyMember } from '../../types'
import { countCompletionsForMember } from '../../types'
import { getMemberColor } from '../../store/member-store'
import { useChoreStore } from '../../store/chore-store'

interface LeaderboardProps {
  members: FamilyMember[]
}

const RANK_STYLES = [
  'text-amber-500',
  'text-gray-400',
  'text-amber-700',
]

export default function Leaderboard({ members }: LeaderboardProps) {
  const completions = useChoreStore((s) => s.completions)

  const sorted = useMemo(
    () =>
      [...members].sort((a, b) => {
        const diff = (b.points ?? 0) - (a.points ?? 0)
        if (diff !== 0) return diff
        return a.name.localeCompare(b.name)
      }),
    [members]
  )

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
        <Trophy size={18} className="text-amber-500" />
        <h3 className="font-semibold">Leaderboard</h3>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((member, i) => {
          const color = getMemberColor(member)
          const choresDone = countCompletionsForMember(completions, member.id)

          return (
            <div key={member.id} className="flex items-center gap-3 px-3 xl:px-4 py-3 min-h-[52px]">
              <span className={`text-lg font-bold w-6 text-center ${RANK_STYLES[i] ?? 'text-muted-foreground'}`}>
                {i + 1}
              </span>
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="h-10 w-10 xl:h-8 xl:w-8 rounded-full object-cover" />
              ) : (
                <div className={`h-10 w-10 xl:h-8 xl:w-8 rounded-full ${color.dot} flex items-center justify-center text-white text-sm font-bold`}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {choresDone} chores done
                </p>
              </div>
              <div className="flex items-center gap-1 text-amber-600 font-semibold">
                <Star size={14} fill="currentColor" />
                {member.points ?? 0}
              </div>
            </div>
          )
        })}
        {sorted.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No data yet. Complete some chores to see the leaderboard!
          </div>
        )}
      </div>
    </div>
  )
}
