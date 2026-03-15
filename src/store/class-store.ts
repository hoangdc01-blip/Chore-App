import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import type { ExtraClass, ClassOccurrence } from '../types'
import { expandRecurrence } from '../lib/recurrence'

interface ClassState {
  classes: ExtraClass[]
  addClass: (cls: Omit<ExtraClass, 'id'>) => void
  removeClass: (id: string) => void
  updateClass: (id: string, updates: Partial<Omit<ExtraClass, 'id'>>) => void
  getOccurrencesForRange: (start: Date, end: Date) => ClassOccurrence[]
}

export const useClassStore = create<ClassState>()(
  persist(
    (set, get) => ({
      classes: [],

      addClass: (cls) => {
        const newClass: ExtraClass = { ...cls, id: crypto.randomUUID() }
        set({ classes: [...get().classes, newClass] })
      },

      removeClass: (id) => {
        set({ classes: get().classes.filter((c) => c.id !== id) })
      },

      updateClass: (id, updates) => {
        set({
          classes: get().classes.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
      },

      getOccurrencesForRange: (start, end) => {
        const { classes } = get()
        const occurrences: ClassOccurrence[] = []

        for (const cls of classes) {
          const dates = expandRecurrence(
            {
              id: cls.id,
              name: cls.name,
              assigneeId: cls.assigneeId,
              startDate: cls.startDate,
              endDate: cls.endDate,
              recurrence: cls.recurrence,
              customDays: cls.customDays,
              points: 0,
            },
            start,
            end
          )

          for (const date of dates) {
            occurrences.push({
              classId: cls.id,
              date: format(date, 'yyyy-MM-dd'),
              classItem: cls,
            })
          }
        }

        return occurrences.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return (a.classItem.startTime ?? '').localeCompare(b.classItem.startTime ?? '')
        })
      },
    }),
    { name: 'classes-storage', version: 1 }
  )
)
