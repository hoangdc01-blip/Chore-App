import { useEffect } from 'react'
import { useAchievementStore } from '../../store/achievement-store'
import { ACHIEVEMENTS } from '../../lib/achievements'
import confetti from 'canvas-confetti'

export default function BadgeCelebration() {
  const newBadgeQueue = useAchievementStore((s) => s.newBadgeQueue)
  const dismissNewBadge = useAchievementStore((s) => s.dismissNewBadge)

  const current = newBadgeQueue[0] ?? null
  const achievement = current ? ACHIEVEMENTS.find((a) => a.id === current.achievementId) : null

  useEffect(() => {
    if (!achievement) return
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } })
    const timer = setTimeout(dismissNewBadge, 3000)
    return () => clearTimeout(timer)
  }, [achievement, dismissNewBadge])

  if (!achievement) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 animate-[fadeIn_200ms_ease-out]"
      onClick={dismissNewBadge}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Badge earned celebration"
        className="bg-card rounded-3xl p-8 text-center shadow-2xl animate-[slideUp_300ms_ease-out] max-w-xs mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-3 animate-bounce">{achievement.emoji}</div>
        <h3 className="text-xl font-extrabold text-foreground mb-1">Badge Earned!</h3>
        <p className="text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-2">
          {achievement.name}
        </p>
        <p className="text-sm text-muted-foreground">{achievement.description}</p>
      </div>
    </div>
  )
}
