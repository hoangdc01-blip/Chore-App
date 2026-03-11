import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Chore, type ChoreOccurrence, type CompletionRecord, type SkippedRecord } from '../types'
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
} from '../lib/firestore-sync'

interface ChoreState {
  chores: Chore[]
  completions: CompletionRecord
  skipped: SkippedRecord
  addChore: (chore: Omit<Chore, 'id'>) => void
  removeChore: (id: string) => void
  removeChoresByMember: (memberId: string) => void
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id'>>) => void
  toggleCompletion: (choreId: string, memberId: string, date: string) => void
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

      addChore: (choreData) => {
        const chore: Chore = { ...choreData, id: generateId() }
        set({ chores: [...get().chores, chore] })
        saveChoreDoc(chore).catch(console.error)
      },

      removeChore: (id) => {
        set({ chores: get().chores.filter((c) => c.id !== id) })
        deleteChoreDoc(id).catch(console.error)
      },

      removeChoresByMember: (memberId) => {
        set({ chores: get().chores.filter((c) => c.assigneeId !== memberId) })
        deleteChoresByMemberDocs(memberId).catch(console.error)
      },

      updateChore: (id, updates) => {
        set({
          chores: get().chores.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
        updateChoreDoc(id, updates).catch(console.error)
      },

      toggleCompletion: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        const completions = { ...get().completions }
        const newValue = !completions[key]
        completions[key] = newValue
        set({ completions })
        if (newValue) {
          setCompletion(key, choreId, memberId, date).catch(console.error)
        } else {
          removeCompletion(key).catch(console.error)
        }
      },

      toggleSkip: (choreId, memberId, date) => {
        const key = makeKey(choreId, memberId, date)
        const skipped = { ...get().skipped }
        const newValue = !skipped[key]
        skipped[key] = newValue
        set({ skipped })
        if (newValue) {
          setSkipped(key, choreId, memberId, date).catch(console.error)
        } else {
          removeSkipped(key).catch(console.error)
        }
      },

      getOccurrencesForRange: (start, end) => {
        const { chores, completions, skipped } = get()
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
      }),
    }
  )
)
