import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Sticker, StickerCategory } from '../types'
import { saveEarnedStickers } from '../lib/firestore-sync'

// ── Sticker Catalog (50 stickers: 10 per category, 7 common / 2 rare / 1 legendary) ──

const STICKER_CATALOG: Sticker[] = [
  // Animals
  { id: 'a1', emoji: '\uD83D\uDC36', name: 'Puppy', category: 'animals', rarity: 'common' },
  { id: 'a2', emoji: '\uD83D\uDC31', name: 'Kitty', category: 'animals', rarity: 'common' },
  { id: 'a3', emoji: '\uD83D\uDC30', name: 'Bunny', category: 'animals', rarity: 'common' },
  { id: 'a4', emoji: '\uD83E\uDD8A', name: 'Fox', category: 'animals', rarity: 'common' },
  { id: 'a5', emoji: '\uD83D\uDC3B', name: 'Bear', category: 'animals', rarity: 'common' },
  { id: 'a6', emoji: '\uD83D\uDC3C', name: 'Panda', category: 'animals', rarity: 'common' },
  { id: 'a7', emoji: '\uD83E\uDD81', name: 'Lion', category: 'animals', rarity: 'common' },
  { id: 'a8', emoji: '\uD83D\uDC2F', name: 'Tiger', category: 'animals', rarity: 'rare' },
  { id: 'a9', emoji: '\uD83E\uDD84', name: 'Unicorn', category: 'animals', rarity: 'rare' },
  { id: 'a10', emoji: '\uD83D\uDC32', name: 'Dragon', category: 'animals', rarity: 'legendary' },

  // Space
  { id: 's1', emoji: '\uD83D\uDE80', name: 'Rocket', category: 'space', rarity: 'common' },
  { id: 's2', emoji: '\uD83C\uDF19', name: 'Moon', category: 'space', rarity: 'common' },
  { id: 's3', emoji: '\u2B50', name: 'Star', category: 'space', rarity: 'common' },
  { id: 's4', emoji: '\uD83E\uDE90', name: 'Planet', category: 'space', rarity: 'common' },
  { id: 's5', emoji: '\u2604\uFE0F', name: 'Comet', category: 'space', rarity: 'common' },
  { id: 's6', emoji: '\uD83D\uDEF8', name: 'UFO', category: 'space', rarity: 'common' },
  { id: 's7', emoji: '\uD83D\uDC7E', name: 'Alien', category: 'space', rarity: 'common' },
  { id: 's8', emoji: '\uD83C\uDF0C', name: 'Galaxy', category: 'space', rarity: 'rare' },
  { id: 's9', emoji: '\uD83D\uDD2D', name: 'Telescope', category: 'space', rarity: 'rare' },
  { id: 's10', emoji: '\uD83D\uDCAB', name: 'Shooting Star', category: 'space', rarity: 'legendary' },

  // Food
  { id: 'f1', emoji: '\uD83C\uDF55', name: 'Pizza', category: 'food', rarity: 'common' },
  { id: 'f2', emoji: '\uD83C\uDF66', name: 'Ice Cream', category: 'food', rarity: 'common' },
  { id: 'f3', emoji: '\uD83C\uDF69', name: 'Donut', category: 'food', rarity: 'common' },
  { id: 'f4', emoji: '\uD83C\uDF70', name: 'Cake', category: 'food', rarity: 'common' },
  { id: 'f5', emoji: '\uD83E\uDDC1', name: 'Cupcake', category: 'food', rarity: 'common' },
  { id: 'f6', emoji: '\uD83C\uDF6B', name: 'Chocolate', category: 'food', rarity: 'common' },
  { id: 'f7', emoji: '\uD83C\uDF6A', name: 'Cookie', category: 'food', rarity: 'common' },
  { id: 'f8', emoji: '\uD83C\uDF53', name: 'Strawberry', category: 'food', rarity: 'rare' },
  { id: 'f9', emoji: '\uD83C\uDF49', name: 'Watermelon', category: 'food', rarity: 'rare' },
  { id: 'f10', emoji: '\uD83C\uDF2E', name: 'Taco', category: 'food', rarity: 'legendary' },

  // Sports
  { id: 'sp1', emoji: '\u26BD', name: 'Soccer', category: 'sports', rarity: 'common' },
  { id: 'sp2', emoji: '\uD83C\uDFC0', name: 'Basketball', category: 'sports', rarity: 'common' },
  { id: 'sp3', emoji: '\uD83C\uDFBE', name: 'Tennis', category: 'sports', rarity: 'common' },
  { id: 'sp4', emoji: '\uD83C\uDFC8', name: 'Football', category: 'sports', rarity: 'common' },
  { id: 'sp5', emoji: '\u26BE', name: 'Baseball', category: 'sports', rarity: 'common' },
  { id: 'sp6', emoji: '\uD83C\uDFAF', name: 'Bullseye', category: 'sports', rarity: 'common' },
  { id: 'sp7', emoji: '\uD83C\uDFC6', name: 'Trophy', category: 'sports', rarity: 'common' },
  { id: 'sp8', emoji: '\uD83E\uDD47', name: 'Gold Medal', category: 'sports', rarity: 'rare' },
  { id: 'sp9', emoji: '\uD83C\uDFAA', name: 'Circus', category: 'sports', rarity: 'rare' },
  { id: 'sp10', emoji: '\uD83C\uDFA8', name: 'Art', category: 'sports', rarity: 'legendary' },

  // Nature
  { id: 'n1', emoji: '\uD83C\uDF38', name: 'Cherry Blossom', category: 'nature', rarity: 'common' },
  { id: 'n2', emoji: '\uD83C\uDF3B', name: 'Sunflower', category: 'nature', rarity: 'common' },
  { id: 'n3', emoji: '\uD83C\uDF08', name: 'Rainbow', category: 'nature', rarity: 'common' },
  { id: 'n4', emoji: '\uD83E\uDD8B', name: 'Butterfly', category: 'nature', rarity: 'common' },
  { id: 'n5', emoji: '\uD83C\uDF3A', name: 'Hibiscus', category: 'nature', rarity: 'common' },
  { id: 'n6', emoji: '\uD83C\uDF40', name: 'Four Leaf Clover', category: 'nature', rarity: 'common' },
  { id: 'n7', emoji: '\uD83C\uDF3F', name: 'Herb', category: 'nature', rarity: 'common' },
  { id: 'n8', emoji: '\uD83C\uDF35', name: 'Cactus', category: 'nature', rarity: 'rare' },
  { id: 'n9', emoji: '\uD83C\uDF44', name: 'Mushroom', category: 'nature', rarity: 'rare' },
  { id: 'n10', emoji: '\uD83D\uDC1A', name: 'Shell', category: 'nature', rarity: 'legendary' },
]

// Stable empty array
const EMPTY_STICKER_IDS: string[] = []

interface StickerState {
  catalog: Sticker[]
  earnedStickers: Record<string, string[]>

  awardRandomSticker: (memberId: string) => Sticker | null
  awardSticker: (memberId: string, stickerId: string) => Sticker | null
  getEarnedStickers: (memberId: string) => Sticker[]
  getSetProgress: (memberId: string, category: StickerCategory) => { earned: number; total: number }
  isSetComplete: (memberId: string, category: StickerCategory) => boolean
}

export const useStickerStore = create<StickerState>()(
  persist(
    (set, get) => ({
      catalog: STICKER_CATALOG,
      earnedStickers: {},

      awardRandomSticker: (memberId) => {
        const { catalog, earnedStickers } = get()
        const earned = new Set(earnedStickers[memberId] ?? EMPTY_STICKER_IDS)
        const unearned = catalog.filter((s) => !earned.has(s.id))

        if (unearned.length === 0) return null

        // Weighted random by rarity: common 70%, rare 25%, legendary 5%
        const weighted: Sticker[] = []
        for (const sticker of unearned) {
          const weight = sticker.rarity === 'common' ? 70 : sticker.rarity === 'rare' ? 25 : 5
          for (let i = 0; i < weight; i++) weighted.push(sticker)
        }

        const picked = weighted[Math.floor(Math.random() * weighted.length)]

        const updatedEarned = {
          ...earnedStickers,
          [memberId]: [...(earnedStickers[memberId] ?? []), picked.id],
        }
        set({ earnedStickers: updatedEarned })
        saveEarnedStickers(memberId, updatedEarned[memberId]).catch(() => {})

        return picked
      },

      awardSticker: (memberId, stickerId) => {
        const { catalog, earnedStickers } = get()
        const earned = new Set(earnedStickers[memberId] ?? EMPTY_STICKER_IDS)
        if (earned.has(stickerId)) return null

        const sticker = catalog.find((s) => s.id === stickerId)
        if (!sticker) return null

        const updatedEarned = {
          ...earnedStickers,
          [memberId]: [...(earnedStickers[memberId] ?? []), stickerId],
        }
        set({ earnedStickers: updatedEarned })
        saveEarnedStickers(memberId, updatedEarned[memberId]).catch(() => {})

        return sticker
      },

      getEarnedStickers: (memberId) => {
        const { catalog, earnedStickers } = get()
        const ids = earnedStickers[memberId] ?? EMPTY_STICKER_IDS
        const idSet = new Set(ids)
        return catalog.filter((s) => idSet.has(s.id))
      },

      getSetProgress: (memberId, category) => {
        const { catalog, earnedStickers } = get()
        const categoryStickers = catalog.filter((s) => s.category === category)
        const earnedIds = new Set(earnedStickers[memberId] ?? EMPTY_STICKER_IDS)
        const earned = categoryStickers.filter((s) => earnedIds.has(s.id)).length
        return { earned, total: categoryStickers.length }
      },

      isSetComplete: (memberId, category) => {
        const progress = get().getSetProgress(memberId, category)
        return progress.earned === progress.total
      },
    }),
    {
      name: 'stickers-storage',
      version: 1,
      partialize: (state) => ({
        earnedStickers: state.earnedStickers,
      }),
    }
  )
)
