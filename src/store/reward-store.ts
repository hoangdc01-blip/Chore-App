import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Reward, Redemption } from '../types'
import { generateId } from '../lib/utils'
import { saveReward, deleteRewardDoc, saveRedemption } from '../lib/firestore-sync'
import { useMemberStore } from './member-store'
import { showToast } from './toast-store'

interface RewardState {
  rewards: Reward[]
  redemptions: Redemption[]
  addReward: (data: Omit<Reward, 'id'>) => void
  removeReward: (id: string) => void
  redeemReward: (rewardId: string, memberId: string) => void
}

export const useRewardStore = create<RewardState>()(
  persist(
    (set, get) => ({
      rewards: [],
      redemptions: [],

      addReward: (data) => {
        const reward: Reward = { ...data, id: generateId() }
        set({ rewards: [...get().rewards, reward] })
        saveReward(reward).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      removeReward: (id) => {
        set({ rewards: get().rewards.filter((r) => r.id !== id) })
        deleteRewardDoc(id).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      redeemReward: (rewardId, memberId) => {
        const reward = get().rewards.find((r) => r.id === rewardId)
        if (!reward) return

        const redemption: Redemption = {
          id: generateId(),
          rewardId,
          memberId,
          redeemedAt: new Date().toISOString(),
        }
        set({ redemptions: [...get().redemptions, redemption] })
        saveRedemption(redemption).catch(() => showToast('Sync failed. Please try again.', 'error'))

        // Deduct points from member balance in Firestore
        useMemberStore.getState().adjustPoints(memberId, -reward.cost)
      },
    }),
    {
      name: 'rewards-storage',
      version: 1,
      partialize: (state) => ({
        rewards: state.rewards,
        redemptions: state.redemptions,
      }),
    }
  )
)
