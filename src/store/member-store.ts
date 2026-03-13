import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type FamilyMember, MEMBER_COLORS } from '../types'
import { generateId } from '../lib/utils'
import { useChoreStore } from './chore-store'
import {
  saveMember as saveMemberDoc,
  deleteMemberDoc,
  updateMemberDoc,
} from '../lib/firestore-sync'
import { showToast } from './toast-store'

interface MemberState {
  members: FamilyMember[]
  _initialized: boolean
  addMember: (name: string, avatar?: string, color?: string) => void
  removeMember: (id: string) => void
  updateMember: (id: string, updates: { name?: string; color?: string; avatar?: string; emojiPasscode?: string; theme?: string }) => void
  adjustPoints: (memberId: string, delta: number) => void
}

export const useMemberStore = create<MemberState>()(
  persist(
    (set, get) => ({
      members: [],
      _initialized: false,
      addMember: (name: string, avatar?: string, color?: string) => {
        const members = get().members
        const newMember: FamilyMember = {
          id: generateId(),
          name,
          color: color ?? String(members.length % MEMBER_COLORS.length),
          avatar,
          points: 0,
        }
        set({ members: [...members, newMember] })
        saveMemberDoc(newMember).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },
      removeMember: (id: string) => {
        useChoreStore.getState().removeChoresByMember(id)
        set({ members: get().members.filter((m) => m.id !== id) })
        deleteMemberDoc(id).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },
      updateMember: (id: string, updates: { name?: string; color?: string; avatar?: string; emojiPasscode?: string }) => {
        const members = get().members.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        )
        set({ members })
        // Save full member to Firestore (not just partial) to handle case where initial save failed
        const updated = members.find((m) => m.id === id)
        if (updated) {
          saveMemberDoc(updated).catch(() => showToast('Sync failed. Please try again.', 'error'))
        }
      },

      adjustPoints: (memberId: string, delta: number) => {
        const members = get().members.map((m) =>
          m.id === memberId ? { ...m, points: Math.max(0, (m.points ?? 0) + delta) } : m
        )
        set({ members })
        const member = members.find((m) => m.id === memberId)
        if (member) {
          updateMemberDoc(memberId, { points: member.points }).catch(() =>
            showToast('Sync failed. Please try again.', 'error')
          )
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

// Default seeding is handled in App.tsx after Firestore check

export function getMemberColor(member: FamilyMember) {
  const index = parseInt(member.color, 10)
  return MEMBER_COLORS[index] ?? MEMBER_COLORS[0]
}
