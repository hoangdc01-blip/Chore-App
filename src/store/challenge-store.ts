import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChallengeState {
  // Key: challengeId:memberId:date → true if bonus claimed
  claimedBonuses: Record<string, boolean>
  hasClaimed: (challengeId: string, memberId: string, date: string) => boolean
  claimBonus: (challengeId: string, memberId: string, date: string) => void
}

export const useChallengeStore = create<ChallengeState>()(persist(
  (set, get) => ({
    claimedBonuses: {},

    hasClaimed: (challengeId, memberId, date) => {
      return !!get().claimedBonuses[`${challengeId}:${memberId}:${date}`]
    },

    claimBonus: (challengeId, memberId, date) => {
      set((s) => ({
        claimedBonuses: {
          ...s.claimedBonuses,
          [`${challengeId}:${memberId}:${date}`]: true,
        },
      }))
    },
  }),
  {
    name: 'challenge-storage',
    version: 1,
    migrate: (persistedState: unknown, version: number) => {
      if (version === 0 || !persistedState) {
        return { claimedBonuses: {} }
      }
      return persistedState as ChallengeState
    },
    partialize: (state) => ({
      claimedBonuses: state.claimedBonuses,
    }),
  },
))
