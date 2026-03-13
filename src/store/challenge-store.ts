import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { setClaimedBonus } from '../lib/firestore-sync'

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
      const key = `${challengeId}:${memberId}:${date}`
      set((s) => ({
        claimedBonuses: {
          ...s.claimedBonuses,
          [key]: true,
        },
      }))

      // Sync to Firestore
      setClaimedBonus(key)
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
