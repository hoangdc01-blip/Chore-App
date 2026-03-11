import { create } from 'zustand'

interface AuthState {
  unlocked: boolean
  pinExists: boolean | null // null = loading
  setUnlocked: (unlocked: boolean) => void
  setPinExists: (exists: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  unlocked: false,
  pinExists: null,
  setUnlocked: (unlocked) => set({ unlocked }),
  setPinExists: (pinExists) => set({ pinExists }),
}))
