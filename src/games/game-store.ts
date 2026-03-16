import { create } from 'zustand'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useFirebase } from '../lib/firebase-flag'
import { format } from 'date-fns'
import { showToast } from '../store/toast-store'

export interface GameHighScore {
  memberId: string
  memberName: string
  score: number
  game: string
  date: string
}

interface GameState {
  highScores: GameHighScore[]
  // Track daily bonus claims: "memberId:date" -> count
  dailyBonusClaims: Record<string, number>

  loadHighScores: () => Promise<void>
  saveHighScore: (entry: GameHighScore) => Promise<void>
  getHighScore: (game: string, memberId: string) => number
  getLeaderboard: (game: string) => GameHighScore[]
  canClaimBonus: (memberId: string) => boolean
  claimBonus: (memberId: string) => void
}

const LOCAL_SCORES_KEY = 'family-chores-game-scores'

function getLocalScores(): GameHighScore[] {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function setLocalScores(scores: GameHighScore[]): void {
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores))
}

function todayKey(memberId: string) {
  return `${memberId}:${format(new Date(), 'yyyy-MM-dd')}`
}

export const useGameStore = create<GameState>()((set, get) => ({
  highScores: [],
  dailyBonusClaims: {},

  loadHighScores: async () => {
    if (!useFirebase) {
      set({ highScores: getLocalScores() })
      return
    }
    try {
      if (!db) return
      const snap = await getDoc(doc(db, 'config', 'gameScores'))
      if (snap.exists()) {
        const data = snap.data()
        set({ highScores: data.scores ?? [] })
      }
    } catch {
      // Offline or not yet created
    }
  },

  saveHighScore: async (entry) => {
    const scores = [...get().highScores]
    const existingIdx = scores.findIndex(
      (s) => s.game === entry.game && s.memberId === entry.memberId
    )
    if (existingIdx >= 0) {
      if (entry.score > scores[existingIdx].score) {
        scores[existingIdx] = entry
      } else {
        return // Not a new high score
      }
    } else {
      scores.push(entry)
    }
    set({ highScores: scores })

    if (!useFirebase) {
      setLocalScores(scores)
      return
    }
    try {
      if (!db) return
      await setDoc(doc(db, 'config', 'gameScores'), { scores })
    } catch {
      showToast('Score sync failed', 'error')
    }
  },

  getHighScore: (game, memberId) => {
    return get().highScores.find(
      (s) => s.game === game && s.memberId === memberId
    )?.score ?? 0
  },

  getLeaderboard: (game) => {
    return [...get().highScores]
      .filter((s) => s.game === game)
      .sort((a, b) => b.score - a.score)
  },

  canClaimBonus: (memberId) => {
    const key = todayKey(memberId)
    return (get().dailyBonusClaims[key] ?? 0) < 3
  },

  claimBonus: (memberId) => {
    const key = todayKey(memberId)
    const claims = { ...get().dailyBonusClaims }
    claims[key] = (claims[key] ?? 0) + 1
    set({ dailyBonusClaims: claims })
  },
}))
