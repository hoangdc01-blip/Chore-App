import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Chore, type ChoreOccurrence, type CompletionRecord, type SkippedRecord, type PendingRecord } from '../types'
import { expandRecurrence } from '../lib/recurrence'
import { generateId } from '../lib/utils'
import { format } from 'date-fns'
import {
  saveChore as saveChoreDoc,
  deleteChoreDoc,
  deleteChoresByMemberDocs,
  updateChoreDoc,
  setCompletion,
  removeCompletion,
  setSkipped,
  removeSkipped,
  setPendingApproval,
  removePendingApproval,
} from '../lib/firestore-sync'
import { useMemberStore } from './member-store'
import { showToast } from './toast-store'
import { useAchievementStore } from './achievement-store'
import { useStickerStore } from './sticker-store'
import { buildAchievementContext } from '../lib/achievements'
import { computeStreak } from '../lib/stats'
import { countCompletionsForMember } from '../types'

// Streak milestone sticker IDs (mapped to specific themed stickers)
const STREAK_STICKER_MAP: Record<number, string> = {
  3: 's3',   // Star (space) for 3-day streak
  7: 's1',   // Rocket (space) for 7-day streak
  14: 's8',  // Galaxy (space, rare) for 14-day streak
  30: 's10', // Shooting Star (space, legendary) for 30-day streak
}

function triggerStickerAward(memberId: string) {
  setTimeout(() => {
    const stickerStore = useStickerStore.getState()
    // Check which categories were incomplete before awarding
    const categoriesBefore = (['animals', 'space', 'food', 'sports', 'nature'] as const).map(
      (cat) => ({ cat, complete: stickerStore.isSetComplete(memberId, cat) })
    )

    const sticker = stickerStore.awardRandomSticker(memberId)
    if (!sticker) return

    // Check if any set just completed — award 10 bonus points
    for (const { cat, complete: wasBefore } of categoriesBefore) {
      if (!wasBefore && stickerStore.isSetComplete(memberId, cat)) {
        useMemberStore.getState().adjustPoints(memberId, 10)
        showToast(`Set complete: ${cat}! +10 bonus points!`, 'success')
      }
    }

    // Award streak milestone stickers
    const { chores, completions, skipped } = useChoreStore.getState()
    const kidChores = chores.filter((c) => c.assigneeId === memberId)
    const streak = computeStreak(memberId, kidChores, completions, skipped)

    const milestoneStickerId = STREAK_STICKER_MAP[streak]
    if (milestoneStickerId) {
      const awarded = stickerStore.awardSticker(memberId, milestoneStickerId)
      if (awarded) {
        showToast(`Streak sticker earned: ${awarded.emoji} ${awarded.name}!`, 'success')
      }
    }
  }, 150)
}

function triggerAchievementCheck(memberId: string) {
  // Defer to avoid calling during state update
  setTimeout(() => {
    const { chores, completions, skipped } = useChoreStore.getState()
    const member = useMemberStore.getState().members.find((m) => m.id === memberId)
    if (!member) return
    const kidChores = chores.filter((c) => c.assigneeId === memberId)
    const streak = computeStreak(memberId, kidChores, completions, skipped)
    const totalCompletions = countCompletionsForMember(completions, memberId)
    const ctx = buildAchievementContext(memberId, completions, member.points ?? 0, streak, 0, 0)
    ctx.totalCompletions = totalCompletions
    useAchievementStore.getState().checkAndAward(ctx)
  }, 100)
}

interface ChoreState {
  chores: Chore[]
  completions: CompletionRecord
  skipped: SkippedRecord
  pendingApprovals: PendingRecord
  addChore: (chore: Omit<Chore, 'id'>) => void
  removeChore: (id: string) => void
  removeChoresByMember: (memberId: string) => void
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id'>>) => void
  toggleCompletion: (choreId: string, memberId: string, date: string) => void
  submitForApproval: (choreId: string, memberId: string, date: string) => void
  approveChore: (choreId: string, memberId: string, date: string) => void
  rejectChore: (choreId: string, memberId: string, date: string) => void
  cancelPending: (choreId: string, memberId: string, date: string) => void
  toggleSkip: (choreId: string, memberId: string, date: string) => void
  getOccurrencesForRange: (start: Date, end: Date) => ChoreOccurrence[]
}

function makeKey(choreId: string, memberId: string, date: string) {
  return `${choreId}:${memberId}:${date}`
}

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: [],
      completions: {},
      skipped: {},
      pendingApprovals: {},

      addChore: (choreData) => {
        const chore: Chore = { ...choreData, id: generateId() }
        set({ chores: [...get().chores, chore] })
        saveChoreDoc(chore).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      removeChore: (id) => {
        set({ chores: get().chores.filter((c) => c.id !== id) })
        deleteChoreDoc(id).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      removeChoresByMember: (memberId) => {
        set({ chores: get().chores.filter((c) => c.assigneeId !== memberId) })
        deleteChoresByMemberDocs(memberId).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      updateChore: (id, updates) => {
        set({
          chores: get().chores.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
        updateChoreDoc(id, updates).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      toggleCompletion: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        const completions = { ...get().completions }
        const wasComplete = !!completions[key]
        completions[key] = !wasComplete
        set({ completions })

        // Update member points balance in Firestore
        const chore = get().chores.find((c) => c.id === choreId)
        const pts = Number(chore?.points) || 1
        useMemberStore.getState().adjustPoints(memberId, wasComplete ? -pts : pts)

        if (!wasComplete) {
          setCompletion(key, choreId, memberId, date).catch(() => showToast('Sync failed. Please try again.', 'error'))
          triggerAchievementCheck(memberId)
          triggerStickerAward(memberId)
        } else {
          removeCompletion(key).catch(() => showToast('Sync failed. Please try again.', 'error'))
        }
      },

      submitForApproval: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        const pendingApprovals = { ...get().pendingApprovals }
        if (pendingApprovals[key]) return // already pending
        pendingApprovals[key] = true
        set({ pendingApprovals })
        setPendingApproval(key, choreId, memberId, date).catch(() => showToast('Sync failed. Please try again.', 'error'))
        showToast('Submitted for parent approval! ⏳', 'success')
      },

      approveChore: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        // Remove from pending
        const pendingApprovals = { ...get().pendingApprovals }
        delete pendingApprovals[key]
        // Add to completions
        const completions = { ...get().completions }
        completions[key] = true
        set({ pendingApprovals, completions })
        // Award points
        const chore = get().chores.find((c) => c.id === choreId)
        const pts = Number(chore?.points) || 1
        useMemberStore.getState().adjustPoints(memberId, pts)
        // Sync to Firestore
        removePendingApproval(key).catch(() => showToast('Sync failed.', 'error'))
        setCompletion(key, choreId, memberId, date).catch(() => showToast('Sync failed.', 'error'))
        triggerAchievementCheck(memberId)
        triggerStickerAward(memberId)
      },

      rejectChore: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        const pendingApprovals = { ...get().pendingApprovals }
        delete pendingApprovals[key]
        set({ pendingApprovals })
        removePendingApproval(key).catch(() => showToast('Sync failed.', 'error'))
      },

      cancelPending: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        const pendingApprovals = { ...get().pendingApprovals }
        if (!pendingApprovals[key]) return
        delete pendingApprovals[key]
        set({ pendingApprovals })
        removePendingApproval(key).catch(() => showToast('Sync failed.', 'error'))
        showToast('Submission cancelled', 'info')
      },

      toggleSkip: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        const skipped = { ...get().skipped }
        const newValue = !skipped[key]
        skipped[key] = newValue
        set({ skipped })
        if (newValue) {
          setSkipped(key, choreId, memberId, date).catch(() => showToast('Sync failed. Please try again.', 'error'))
        } else {
          removeSkipped(key).catch(() => showToast('Sync failed. Please try again.', 'error'))
        }
      },

      getOccurrencesForRange: (start, end) => {
        const { chores, completions, skipped, pendingApprovals } = get()
        const occurrences: ChoreOccurrence[] = []

        for (const chore of chores) {
          const dates = expandRecurrence(chore, start, end)
          for (const date of dates) {
            const dateStr = format(date, 'yyyy-MM-dd')
            const key = makeKey(chore.id, chore.assigneeId, dateStr)
            occurrences.push({
              choreId: chore.id,
              date: dateStr,
              chore,
              isCompleted: !!completions[key],
              isSkipped: !!skipped[key],
              isPending: !!pendingApprovals[key],
            })
          }
        }

        return occurrences
      },
    }),
    {
      name: 'chores-storage',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version === 0) {
          state.skipped = state.skipped ?? {}
        }
        if (version <= 1) {
          // Migrate chores: add points default
          const chores = ((state.chores as Chore[]) ?? []).map((c) => ({
            ...c,
            points: c.points ?? 1,
          }))

          // Migrate keys from "choreId:date" to "choreId:memberId:date"
          const choreMap = new Map(chores.map((c) => [c.id, c]))
          const migrateKeys = (record: Record<string, boolean>) => {
            const newRecord: Record<string, boolean> = {}
            for (const [key, value] of Object.entries(record)) {
              const parts = key.split(':')
              if (parts.length === 2) {
                const [choreId, date] = parts
                const chore = choreMap.get(choreId)
                if (chore) {
                  newRecord[`${choreId}:${chore.assigneeId}:${date}`] = value
                }
              } else {
                newRecord[key] = value
              }
            }
            return newRecord
          }

          return {
            ...state,
            chores,
            completions: migrateKeys((state.completions as Record<string, boolean>) ?? {}),
            skipped: migrateKeys((state.skipped as Record<string, boolean>) ?? {}),
          }
        }
        return state
      },
      partialize: (state) => ({
        chores: state.chores,
        completions: state.completions,
        skipped: state.skipped,
        pendingApprovals: state.pendingApprovals,
      }),
    }
  )
)
