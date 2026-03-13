import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { checkNewAchievements, type AchievementContext } from '../lib/achievements'
import { saveEarnedBadges } from '../lib/firestore-sync'

// Stable empty array to avoid creating new references on every selector call
const EMPTY_BADGES: string[] = []

interface AchievementState {
  // memberId → array of earned achievement IDs
  earnedBadges: Record<string, string[]>
  // Queue of { memberId, achievementId } for celebration display
  newBadgeQueue: Array<{ memberId: string; achievementId: string }>

  getEarnedBadges: (memberId: string) => string[]
  checkAndAward: (context: AchievementContext) => void
  dismissNewBadge: () => void
}

export const useAchievementStore = create<AchievementState>()(persist(
  (set, get) => ({
    earnedBadges: {},
    newBadgeQueue: [],

    getEarnedBadges: (memberId) => {
      return get().earnedBadges[memberId] ?? EMPTY_BADGES
    },

    checkAndAward: (context) => {
      const { earnedBadges, newBadgeQueue } = get()
      const alreadyEarned = earnedBadges[context.memberId] ?? []
      const newlyEarned = checkNewAchievements(context, alreadyEarned)

      if (newlyEarned.length === 0) return

      const updatedEarned = {
        ...earnedBadges,
        [context.memberId]: [...alreadyEarned, ...newlyEarned],
      }

      const newQueue = [
        ...newBadgeQueue,
        ...newlyEarned.map((id) => ({ memberId: context.memberId, achievementId: id })),
      ]

      set({ earnedBadges: updatedEarned, newBadgeQueue: newQueue })

      // Sync to Firestore
      saveEarnedBadges(context.memberId, updatedEarned[context.memberId])
    },

    dismissNewBadge: () => {
      set((s) => ({ newBadgeQueue: s.newBadgeQueue.slice(1) }))
    },
  }),
  {
    name: 'achievements-storage',
    version: 1,
    migrate: (persistedState: unknown, version: number) => {
      if (version === 0 || !persistedState) {
        return { earnedBadges: {}, newBadgeQueue: [] }
      }
      return persistedState as AchievementState
    },
    partialize: (state) => ({
      earnedBadges: state.earnedBadges,
      // Don't persist the queue — it's transient
    }),
  },
))
