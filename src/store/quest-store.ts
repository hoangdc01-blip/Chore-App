import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import { generateId } from '../lib/utils'
import { useMemberStore } from './member-store'
import { useChoreStore } from './chore-store'
import { saveQuestDoc } from '../lib/firestore-sync'
import { showToast } from './toast-store'

export interface TeamQuest {
  id: string
  date: string // yyyy-MM-dd
  member1Id: string
  member2Id: string
  bonusPoints: number
  description: string
  completed: boolean
}

interface QuestState {
  quests: TeamQuest[]
  lastPairing: [string, string] | null

  generateDailyQuest: () => void
  checkQuestCompletion: (questId: string) => void
  completeQuest: (questId: string) => void
  getTodayQuest: () => TeamQuest | null
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      quests: [],
      lastPairing: null,

      generateDailyQuest: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const existing = get().quests.find((q) => q.date === today)
        if (existing) return

        const members = useMemberStore.getState().members
        if (members.length < 2) return

        // Pick 2 random kids, avoiding the same pair as yesterday
        const lastPair = get().lastPairing
        let attempts = 0
        let kid1Idx: number
        let kid2Idx: number

        do {
          kid1Idx = Math.floor(Math.random() * members.length)
          kid2Idx = Math.floor(Math.random() * members.length)
          attempts++
        } while (
          (kid1Idx === kid2Idx ||
            (lastPair &&
              ((members[kid1Idx].id === lastPair[0] && members[kid2Idx].id === lastPair[1]) ||
                (members[kid1Idx].id === lastPair[1] && members[kid2Idx].id === lastPair[0])))) &&
          attempts < 20
        )

        if (kid1Idx === kid2Idx) return // Only 1 member? Shouldn't happen due to guard above

        const kid1 = members[kid1Idx]
        const kid2 = members[kid2Idx]
        const bonusPoints = 5

        const quest: TeamQuest = {
          id: generateId(),
          date: today,
          member1Id: kid1.id,
          member2Id: kid2.id,
          bonusPoints,
          description: `${kid1.name} + ${kid2.name}: Both finish all your chores today for ${bonusPoints} bonus points each!`,
          completed: false,
        }

        set({
          quests: [...get().quests, quest],
          lastPairing: [kid1.id, kid2.id],
        })

        saveQuestDoc(quest).catch(() => showToast('Sync failed. Please try again.', 'error'))
      },

      checkQuestCompletion: (questId: string) => {
        const quest = get().quests.find((q) => q.id === questId)
        if (!quest || quest.completed) return

        const store = useChoreStore.getState()
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date()
        todayEnd.setHours(23, 59, 59, 999)
        const occurrences = store.getOccurrencesForRange(todayStart, todayEnd)

        const checkAllDone = (memberId: string): boolean => {
          const memberOccs = occurrences.filter(
            (o) => o.chore.assigneeId === memberId && !o.isSkipped
          )
          if (memberOccs.length === 0) return false // No chores = not eligible
          return memberOccs.every((o) => o.isCompleted)
        }

        const kid1Done = checkAllDone(quest.member1Id)
        const kid2Done = checkAllDone(quest.member2Id)

        if (kid1Done && kid2Done) {
          get().completeQuest(questId)
        }
      },

      completeQuest: (questId: string) => {
        const quest = get().quests.find((q) => q.id === questId)
        if (!quest || quest.completed) return

        // Award bonus points to both kids
        const memberStore = useMemberStore.getState()
        memberStore.adjustPoints(quest.member1Id, quest.bonusPoints)
        memberStore.adjustPoints(quest.member2Id, quest.bonusPoints)

        // Mark quest as completed
        const updatedQuests = get().quests.map((q) =>
          q.id === questId ? { ...q, completed: true } : q
        )
        set({ quests: updatedQuests })

        const completedQuest = updatedQuests.find((q) => q.id === questId)
        if (completedQuest) {
          saveQuestDoc(completedQuest).catch(() =>
            showToast('Sync failed. Please try again.', 'error')
          )
        }

        showToast(`Team quest complete! +${quest.bonusPoints} bonus points each!`, 'success')
      },

      getTodayQuest: () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        return get().quests.find((q) => q.date === today) ?? null
      },
    }),
    {
      name: 'quest-storage',
      partialize: (state) => ({
        quests: state.quests,
        lastPairing: state.lastPairing,
      }),
    }
  )
)
