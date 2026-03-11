import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type TeamMember, MEMBER_COLORS } from '../types'

interface MemberState {
  members: TeamMember[]
  addMember: (name: string) => void
  removeMember: (id: string) => void
  updateMember: (id: string, updates: { name?: string; color?: string }) => void
}

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: [],
      addMember: (name: string) => {
        const members = get().members
        const colorIndex = members.length % MEMBER_COLORS.length
        const newMember: TeamMember = {
          id: crypto.randomUUID(),
          name,
          color: String(colorIndex),
        }
        set({ members: [...members, newMember] })
      },
      removeMember: (id: string) => {
        set({ members: get().members.filter((m) => m.id !== id) })
      },
      updateMember: (id: string, updates: { name?: string; color?: string }) => {
        set({
          members: get().members.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })
      },
    }),
    { name: 'members-storage' }
  )
)

export function getMemberColor(member: TeamMember) {
  const index = parseInt(member.color, 10)
  return MEMBER_COLORS[index] ?? MEMBER_COLORS[0]
}
