import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { generateId } from '../lib/utils'
import { saveRoutine, deleteRoutineDoc, saveRoutineProgress } from '../lib/firestore-sync'
import { showToast } from './toast-store'

export interface RoutineStep {
  id: string
  label: string
  emoji: string
}

export interface Routine {
  id: string
  type: 'bedtime' | 'morning'
  triggerTime: string // HH:mm format
  steps: RoutineStep[]
  enabled: boolean
}

export interface RoutineProgress {
  routineId: string
  memberId: string
  date: string // yyyy-MM-dd
  completedSteps: string[] // step IDs
  startedAt: string // ISO timestamp
}

const DEFAULT_BEDTIME_STEPS: RoutineStep[] = [
  { id: 'bt1', label: 'Brush teeth', emoji: '\u{1FAA5}' },
  { id: 'bt2', label: 'Put on pajamas', emoji: '\u{1F455}' },
  { id: 'bt3', label: "Pick tomorrow's clothes", emoji: '\u{1F457}' },
  { id: 'bt4', label: 'Story time', emoji: '\u{1F4D6}' },
]

const DEFAULT_MORNING_STEPS: RoutineStep[] = [
  { id: 'mr1', label: 'Make bed', emoji: '\u{1F6CF}\uFE0F' },
  { id: 'mr2', label: 'Get dressed', emoji: '\u{1F454}' },
  { id: 'mr3', label: 'Eat breakfast', emoji: '\u{1F963}' },
  { id: 'mr4', label: 'Pack bag', emoji: '\u{1F392}' },
]

function createDefaultRoutines(): Routine[] {
  return [
    {
      id: 'default-bedtime',
      type: 'bedtime',
      triggerTime: '20:00',
      steps: DEFAULT_BEDTIME_STEPS,
      enabled: true,
    },
    {
      id: 'default-morning',
      type: 'morning',
      triggerTime: '07:00',
      steps: DEFAULT_MORNING_STEPS,
      enabled: true,
    },
  ]
}

function makeProgressKey(routineId: string, memberId: string, date: string): string {
  return `${routineId}:${memberId}:${date}`
}

interface RoutineState {
  routines: Routine[]
  progress: Record<string, RoutineProgress> // key: routineId:memberId:date

  addRoutine: (routine: Omit<Routine, 'id'>) => void
  updateRoutine: (id: string, updates: Partial<Routine>) => void
  removeRoutine: (id: string) => void
  completeStep: (routineId: string, memberId: string, stepId: string) => void
  getProgress: (routineId: string, memberId: string, date: string) => RoutineProgress | null
  isRoutineTime: (type: 'bedtime' | 'morning') => boolean
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      routines: createDefaultRoutines(),
      progress: {},

      addRoutine: (routineData) => {
        const routine: Routine = { ...routineData, id: generateId() }
        set({ routines: [...get().routines, routine] })
        saveRoutine(routine as unknown as Record<string, unknown> & { id: string }).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      updateRoutine: (id, updates) => {
        const routines = get().routines.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        )
        set({ routines })
        const updated = routines.find((r) => r.id === id)
        if (updated) {
          saveRoutine(updated as unknown as Record<string, unknown> & { id: string }).catch(() => showToast('Sync failed. Please try again.', 'error'))
        }
      },

      removeRoutine: (id) => {
        set({ routines: get().routines.filter((r) => r.id !== id) })
        deleteRoutineDoc(id).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      completeStep: (routineId, memberId, stepId) => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const key = makeProgressKey(routineId, memberId, today)
        const existing = get().progress[key]

        const updated: RoutineProgress = existing
          ? {
              ...existing,
              completedSteps: existing.completedSteps.includes(stepId)
                ? existing.completedSteps
                : [...existing.completedSteps, stepId],
            }
          : {
              routineId,
              memberId,
              date: today,
              completedSteps: [stepId],
              startedAt: new Date().toISOString(),
            }

        set({
          progress: { ...get().progress, [key]: updated },
        })
        saveRoutineProgress(key, updated).catch(() =>
          showToast('Sync failed. Please try again.', 'error')
        )
      },

      getProgress: (routineId, memberId, date) => {
        const key = makeProgressKey(routineId, memberId, date)
        return get().progress[key] ?? null
      },

      isRoutineTime: (type) => {
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()

        const routines = get().routines.filter((r) => r.type === type && r.enabled)
        if (routines.length === 0) return false

        for (const routine of routines) {
          const [h, m] = routine.triggerTime.split(':').map(Number)
          const triggerMinutes = h * 60 + m

          if (type === 'bedtime') {
            // Bedtime window: trigger time to trigger time + 2 hours
            if (currentMinutes >= triggerMinutes && currentMinutes <= triggerMinutes + 120) {
              return true
            }
          } else {
            // Morning window: trigger time to trigger time + 2 hours
            if (currentMinutes >= triggerMinutes && currentMinutes <= triggerMinutes + 120) {
              return true
            }
          }
        }
        return false
      },
    }),
    {
      name: 'routines-storage',
      version: 1,
      partialize: (state) => ({
        routines: state.routines,
        progress: state.progress,
      }),
    }
  )
)
