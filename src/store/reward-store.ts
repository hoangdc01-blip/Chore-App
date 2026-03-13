import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Reward, Redemption, Coupon } from '../types'
import { generateId } from '../lib/utils'
import { saveReward, deleteRewardDoc, saveRedemption, saveCoupon, updateCouponDoc } from '../lib/firestore-sync'
import { useMemberStore } from './member-store'
import { showToast } from './toast-store'

interface RewardState {
  rewards: Reward[]
  redemptions: Redemption[]
  coupons: Coupon[]
  addReward: (data: Omit<Reward, 'id'>) => void
  removeReward: (id: string) => void
  redeemReward: (rewardId: string, memberId: string) => void
  markCouponUsed: (couponId: string) => void
}

export const useRewardStore = create<RewardState>()(
  persist(
    (set, get) => ({
      rewards: [],
      redemptions: [],
      coupons: [],

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

        // Create a coupon
        const coupon: Coupon = {
          id: generateId(),
          rewardId,
          rewardName: reward.name,
          rewardEmoji: reward.emoji,
          memberId,
          redeemedAt: new Date().toISOString(),
          used: false,
        }
        set({ coupons: [...get().coupons, coupon] })
        saveCoupon(coupon).catch(() => showToast('Sync failed. Please try again.', 'error'))

        // Deduct points from member balance in Firestore
        useMemberStore.getState().adjustPoints(memberId, -reward.cost)
      },

      markCouponUsed: (couponId) => {
        set({
          coupons: get().coupons.map((c) =>
            c.id === couponId ? { ...c, used: true } : c
          ),
        })
        updateCouponDoc(couponId, { used: true }).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },
    }),
    {
      name: 'rewards-storage',
      version: 1,
      partialize: (state) => ({
        rewards: state.rewards,
        redemptions: state.redemptions,
        coupons: state.coupons,
      }),
    }
  )
)
