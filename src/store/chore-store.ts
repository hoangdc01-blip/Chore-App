import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Chore, type ChoreOccurrence, type CompletionRecord } from '../types'
import { expandRecurrence } from '../lib/recurrence'
import { format } from 'date-fns'

interface ChoreState {
  chores: Chore[]
  completions: CompletionRecord
  addChore: (chore: Omit<Chore, 'id'>) => void
  removeChore: (id: string) => void
  updateChore: (id: string, updates: Partial<Omit<Chore, 'id'>>) => void
  toggleCompletion: (choreId: string, date: string) => void
  getOccurrencesForRange: (start: Date, end: Date) => ChoreOccurrence[]
}

function makeKey(choreId: string, date: string) {
  return `${choreId}:${date}`
}

export const useChoreStore = create<ChoreState>()(
  persist(
    (set, get) => ({
      chores: [],
      completions: {},

      addChore: (choreData) => {
        const chore: Chore = { ...choreData, id: crypto.randomUUID() }
        set({ chores: [...get().chores, chore] })
      },

      removeChore: (id) => {
        set({ chores: get().chores.filter((c) => c.id !== id) })
      },

      updateChore: (id, updates) => {
        set({
          chores: get().chores.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
      },

      toggleCompletion: (choreId, date) => {
        const key = makeKey(choreId, date)
        const completions = { ...get().completions }
        completions[key] = !completions[key]
        set({ completions })
      },

      getOccurrencesForRange: (start, end) => {
        const { chores, completions } = get()
        const occurrences: ChoreOccurrence[] = []

        for (const chore of chores) {
          const dates = expandRecurrence(chore, start, end)
          for (const date of dates) {
            const dateStr = format(date, 'yyyy-MM-dd')
            const key = makeKey(chore.id, dateStr)
            occurrences.push({
              choreId: chore.id,
              date: dateStr,
              chore,
              isCompleted: !!completions[key],
            })
          }
        }

        return occurrences
      },
    }),
    {
      name: 'chores-storage',
      partialize: (state) => ({
        chores: state.chores,
        completions: state.completions,
      }),
    }
  )
)
