import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type FamilyMember, MEMBER_COLORS } from '../types'
import { generateId } from '../lib/utils'
import { useChoreStore } from './chore-store'
import {
  saveMember as saveMemberDoc,
  deleteMemberDoc,
} from '../lib/firestore-sync'

export const DEFAULT_KIDS = [
  { name: 'Bap', color: '0' },
  { name: 'Bo', color: '1' },
  { name: 'Boi', color: '2' },
  { name: 'Bow', color: '3' },
]

interface MemberState {
  members: FamilyMember[]
  _initialized: boolean
  addMember: (name: string, avatar?: string) => void
  removeMember: (id: string) => void
  updateMember: (id: string, updates: { name?: string; color?: string; avatar?: string }) => void
}

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: [],
      _initialized: false,
      addMember: (name: string, avatar?: string) => {
        const members = get().members
        const colorIndex = members.length % MEMBER_COLORS.length
        const newMember: FamilyMember = {
          id: generateId(),
          name,
          color: String(colorIndex),
          avatar,
        }
        set({ members: [...members, newMember] })
        saveMemberDoc(newMember).catch(console.error)
      },
      removeMember: (id: string) => {
        useChoreStore.getState().removeChoresByMember(id)
        set({ members: get().members.filter((m) => m.id !== id) })
        deleteMemberDoc(id).catch(console.error)
      },
      updateMember: (id: string, updates: { name?: string; color?: string; avatar?: string }) => {
        const members = get().members.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        )
        set({ members })
        // Save full member to Firestore (not just partial) to handle case where initial save failed
        const updated = members.find((m) => m.id === id)
        if (updated) {
          saveMemberDoc(updated).catch(console.error)
        }
      },
    }),
    {
      name: 'members-storage',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>
        if (version <= 1) {
          const members = (state.members as FamilyMember[])?.map((m) => ({
            ...m,
            avatar: undefined,
          })) ?? []
          return { ...state, members, _initialized: true }
        }
        return state
      },
    }
  )
)

// Seed default kids on first ever run (local only — Firestore seeding handled in App.tsx)
const initState = useMemberStore.getState()
if (!initState._initialized && initState.members.length === 0) {
  DEFAULT_KIDS.forEach((kid) => useMemberStore.getState().addMember(kid.name))
  useMemberStore.setState({ _initialized: true })
}

export function getMemberColor(member: FamilyMember) {
  const index = parseInt(member.color, 10)
  return MEMBER_COLORS[index] ?? MEMBER_COLORS[0]
}
