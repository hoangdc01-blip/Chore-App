import { useState, useMemo } from 'react'
import { useStickerStore } from '../../store/sticker-store'
import { STICKER_CATEGORIES } from '../../types'
import type { StickerCategory } from '../../types'
import { cn } from '../../lib/utils'

const CATEGORY_LABELS: Record<StickerCategory, { label: string; icon: string }> = {
  animals: { label: 'Animals', icon: '\uD83D\uDC3E' },
  space: { label: 'Space', icon: '\uD83D\uDE80' },
  food: { label: 'Food', icon: '\uD83C\uDF55' },
  sports: { label: 'Sports', icon: '\u26BD' },
  nature: { label: 'Nature', icon: '\uD83C\uDF3F' },
}

const RARITY_COLORS: Record<string, string> = {
  common: 'ring-gray-300 dark:ring-gray-600',
  rare: 'ring-blue-400 dark:ring-blue-500',
  legendary: 'ring-amber-400 dark:ring-amber-500',
}

const RARITY_BG: Record<string, string> = {
  common: 'bg-muted/50',
  rare: 'bg-blue-50 dark:bg-blue-900/30',
  legendary: 'bg-amber-50 dark:bg-amber-900/30',
}

interface StickerAlbumProps {
  memberId: string
}

export default function StickerAlbum({ memberId }: StickerAlbumProps) {
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('animals')
  const catalog = useStickerStore((s) => s.catalog)
  const earnedStickersMap = useStickerStore((s) => s.earnedStickers)

  const earnedIds = useMemo(
    () => new Set(earnedStickersMap[memberId] ?? []),
    [earnedStickersMap, memberId]
  )

  const totalEarned = earnedIds.size
  const totalStickers = catalog.length

  const categoryStickers = useMemo(
    () => catalog.filter((s) => s.category === activeCategory),
    [catalog, activeCategory]
  )

  const categoryEarned = categoryStickers.filter((s) => earnedIds.has(s.id)).length
  const categoryTotal = categoryStickers.length
  const isCategoryComplete = categoryEarned === categoryTotal

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-muted-foreground">
          Sticker Album ({totalEarned}/{totalStickers})
        </h4>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {STICKER_CATEGORIES.map((cat) => {
          const info = CATEGORY_LABELS[cat]
          const progress = useStickerStore.getState().getSetProgress(memberId, cat)
          const complete = progress.earned === progress.total
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all whitespace-nowrap min-h-[36px]',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
                complete && activeCategory !== cat && 'ring-2 ring-amber-400'
              )}
            >
              <span>{info.icon}</span>
              <span>{info.label}</span>
              <span className="opacity-70">{progress.earned}/{progress.total}</span>
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isCategoryComplete ? 'bg-amber-500' : 'bg-primary'
            )}
            style={{ width: `${categoryTotal > 0 ? (categoryEarned / categoryTotal) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Sticker grid */}
      <div
        className={cn(
          'grid grid-cols-5 gap-2 p-2 rounded-xl border',
          isCategoryComplete
            ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
            : 'border-border bg-card'
        )}
      >
        {categoryStickers.map((sticker) => {
          const isEarned = earnedIds.has(sticker.id)
          return (
            <div
              key={sticker.id}
              title={isEarned ? `${sticker.name} (${sticker.rarity})` : '???'}
              className={cn(
                'aspect-square rounded-xl flex items-center justify-center text-2xl transition-all ring-2',
                isEarned
                  ? `${RARITY_BG[sticker.rarity]} ${RARITY_COLORS[sticker.rarity]} shadow-sm`
                  : 'bg-muted text-muted-foreground/30 ring-transparent grayscale'
              )}
            >
              {isEarned ? sticker.emoji : '?'}
            </div>
          )
        })}
      </div>

      {/* Rarity legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
          Common
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />
          Rare
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
          Legendary
        </span>
      </div>
    </div>
  )
}
