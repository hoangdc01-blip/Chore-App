import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AppMode = 'select' | 'parent' | 'kid'

interface AppState {
  mode: AppMode
  activeKidId: string | null
  setMode: (mode: AppMode) => void
  setActiveKidId: (id: string | null) => void
  enterParentMode: () => void
  enterKidMode: (kidId: string) => void
  switchProfile: () => void
}

export const useAppStore = create<AppState>()(persist(
  (set) => ({
    mode: 'select',
    activeKidId: null,
    setMode: (mode) => set({ mode }),
    setActiveKidId: (id) => set({ activeKidId: id }),
    enterParentMode: () => set({ mode: 'parent', activeKidId: null }),
    enterKidMode: (kidId) => set({ mode: 'kid', activeKidId: kidId }),
    switchProfile: () => set({ mode: 'select', activeKidId: null }),
  }),
  {
    name: 'app-storage',
    version: 1,
    migrate: (persistedState: unknown, version: number) => {
      if (version === 0 || !persistedState) {
        return { mode: 'select' as AppMode, activeKidId: null }
      }
      return persistedState as AppState
    },
    partialize: (state) => ({
      mode: state.mode,
      activeKidId: state.activeKidId,
    }),
  },
))
