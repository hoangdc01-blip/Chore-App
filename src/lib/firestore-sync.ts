import { getFirebaseDb } from './firebase'
import { useFirebase } from './firebase-flag'
import type { FamilyMember, Chore, CompletionRecord, SkippedRecord, PendingRecord, Reward, Redemption, Coupon } from '../types'

async function getFirestoreMethods() {
  const mod = await import('firebase/firestore')
  return mod
}

// Strip undefined values — Firestore rejects them
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clean<T>(obj: T): Record<string, any> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) result[key] = value
  }
  return result
}

// ── Members ──

export async function fetchMembers(): Promise<FamilyMember[]> {
  if (!useFirebase) return []
  const db = await getFirebaseDb()
  const { collection, getDocs } = await getFirestoreMethods()
  const snap = await getDocs(collection(db, 'members'))
  return snap.docs.map((d) => d.data() as FamilyMember)
}

export async function saveMember(member: FamilyMember): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'members', member.id), clean(member))
}

export async function deleteMemberDoc(id: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await getFirestoreMethods()
  await deleteDoc(doc(db, 'members', id))
}

export async function updateMemberDoc(id: string, updates: Partial<FamilyMember>): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'members', id), clean(updates), { merge: true })
}

// ── Chores ──

export async function fetchChores(): Promise<Chore[]> {
  if (!useFirebase) return []
  const db = await getFirebaseDb()
  const { collection, getDocs } = await getFirestoreMethods()
  const snap = await getDocs(collection(db, 'chores'))
  return snap.docs.map((d) => d.data() as Chore)
}

export async function saveChore(chore: Chore): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'chores', chore.id), clean(chore))
}

export async function deleteChoreDoc(id: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await getFirestoreMethods()
  await deleteDoc(doc(db, 'chores', id))
}

export async function deleteChoresByMemberDocs(memberId: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { collection, query, where, getDocs, writeBatch } = await getFirestoreMethods()
  const q = query(collection(db, 'chores'), where('assigneeId', '==', memberId))
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

export async function updateChoreDoc(id: string, updates: Partial<Chore>): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'chores', id), clean(updates), { merge: true })
}

// ── Completions ──

export async function fetchCompletions(): Promise<CompletionRecord> {
  if (!useFirebase) return {}
  const db = await getFirebaseDb()
  const { collection, getDocs } = await getFirestoreMethods()
  const snap = await getDocs(collection(db, 'completions'))
  const record: CompletionRecord = {}
  snap.docs.forEach((d) => {
    record[d.id] = true
  })
  return record
}

export async function setCompletion(key: string, choreId: string, memberId: string, date: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'completions', key), { choreId, memberId, date, done: true })
}

export async function removeCompletion(key: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await getFirestoreMethods()
  await deleteDoc(doc(db, 'completions', key))
}

// ── Skipped ──

export async function fetchSkipped(): Promise<SkippedRecord> {
  if (!useFirebase) return {}
  const db = await getFirebaseDb()
  const { collection, getDocs } = await getFirestoreMethods()
  const snap = await getDocs(collection(db, 'skipped'))
  const record: SkippedRecord = {}
  snap.docs.forEach((d) => {
    record[d.id] = true
  })
  return record
}

export async function setSkipped(key: string, choreId: string, memberId: string, date: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'skipped', key), { choreId, memberId, date, skipped: true })
}

export async function removeSkipped(key: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await getFirestoreMethods()
  await deleteDoc(doc(db, 'skipped', key))
}

// ── Pending Approvals ──

export async function fetchPendingApprovals(): Promise<PendingRecord> {
  if (!useFirebase) return {}
  const db = await getFirebaseDb()
  const { collection, getDocs } = await getFirestoreMethods()
  const snap = await getDocs(collection(db, 'pendingApprovals'))
  const record: PendingRecord = {}
  snap.docs.forEach((d) => {
    record[d.id] = true
  })
  return record
}

export async function setPendingApproval(key: string, choreId: string, memberId: string, date: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'pendingApprovals', key), { choreId, memberId, date, pending: true, submittedAt: Date.now() })
}

export async function removePendingApproval(key: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await getFirestoreMethods()
  await deleteDoc(doc(db, 'pendingApprovals', key))
}

// ── Rewards ──

export async function saveReward(reward: Reward): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'rewards', reward.id), clean(reward))
}

export async function deleteRewardDoc(id: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await getFirestoreMethods()
  await deleteDoc(doc(db, 'rewards', id))
}

// ── Redemptions ──

export async function saveRedemption(redemption: Redemption): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'redemptions', redemption.id), clean(redemption))
}

// ── Coupons ──

export async function saveCoupon(coupon: Coupon): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'coupons', coupon.id), clean(coupon))
}

export async function updateCouponDoc(id: string, updates: Partial<Coupon>): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'coupons', id), clean(updates), { merge: true })
}

// ── Achievements ──

export async function saveEarnedBadges(memberId: string, badgeIds: string[]): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'achievements', memberId), { badgeIds })
}

// ── Stickers ──

export async function saveEarnedStickers(memberId: string, stickerIds: string[]): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'stickers', memberId), { stickerIds })
}

// ── Routines ──

export async function saveRoutine(routine: Record<string, unknown> & { id: string }): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'routines', routine.id), clean(routine))
}

export async function deleteRoutineDoc(id: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, deleteDoc } = await getFirestoreMethods()
  await deleteDoc(doc(db, 'routines', id))
}

export async function saveRoutineProgress(key: string, progress: { routineId: string; memberId: string; date: string; completedSteps: string[]; startedAt: string }): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'routineProgress', key), clean(progress))
}

// ── Quests ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveQuestDoc(quest: { id: string } & Record<string, any>): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'quests', quest.id), clean(quest))
}

// ── Claimed Bonuses ──

export async function setClaimedBonus(key: string): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, setDoc } = await getFirestoreMethods()
  await setDoc(doc(db, 'claimedBonuses', key), { claimed: true })
}

// ── Bulk fetch ──

export async function fetchAllData(): Promise<{
  members: FamilyMember[]
  chores: Chore[]
  completions: CompletionRecord
  skipped: SkippedRecord
}> {
  if (!useFirebase) return { members: [], chores: [], completions: {}, skipped: {} }
  const [members, chores, completions, skipped] = await Promise.all([
    fetchMembers(),
    fetchChores(),
    fetchCompletions(),
    fetchSkipped(),
  ])
  return { members, chores, completions, skipped }
}

// ── Real-time listeners ──

export function subscribeToAll(onData: (data: {
  members: FamilyMember[]
  chores: Chore[]
  completions: CompletionRecord
  skipped: SkippedRecord
  pendingApprovals: PendingRecord
  rewards: Reward[]
  redemptions: Redemption[]
  coupons: Coupon[]
  earnedBadges: Record<string, string[]>
  claimedBonuses: Record<string, boolean>
  earnedStickers: Record<string, string[]>
}) => void): () => void {
  if (!useFirebase) {
    // No-op: data is already in localStorage via Zustand persist
    return () => {}
  }

  let members: FamilyMember[] = []
  let chores: Chore[] = []
  let completions: CompletionRecord = {}
  let skipped: SkippedRecord = {}
  let pendingApprovals: PendingRecord = {}
  let rewards: Reward[] = []
  let redemptions: Redemption[] = []
  let coupons: Coupon[] = []
  let earnedBadges: Record<string, string[]> = {}
  let claimedBonuses: Record<string, boolean> = {}
  let earnedStickersData: Record<string, string[]> = {}
  let initialLoad = 0
  const TOTAL_COLLECTIONS = 11

  const notify = () => {
    if (initialLoad < TOTAL_COLLECTIONS) return
    onData({ members, chores, completions, skipped, pendingApprovals, rewards, redemptions, coupons, earnedBadges, claimedBonuses, earnedStickers: earnedStickersData })
  }

  const handleError = (name: string) => (err: unknown) => {
    console.warn(`[firestore] ${name} listener error:`, err)
    if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
    notify()
  }

  // Store unsubscribe functions as they become available
  const unsubFns: (() => void)[] = []
  let cancelled = false

  // Initialize listeners asynchronously
  ;(async () => {
    const db = await getFirebaseDb()
    if (cancelled) return
    const { collection, onSnapshot } = await getFirestoreMethods()
    if (cancelled) return

    const unsub1 = onSnapshot(collection(db, 'members'), (snap) => {
      members = snap.docs.map((d) => {
        const data = d.data()
        return { ...data, points: Number(data.points) || 0 } as FamilyMember
      })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('members'))
    unsubFns.push(unsub1)

    const unsub2 = onSnapshot(collection(db, 'chores'), (snap) => {
      chores = snap.docs.map((d) => {
        const data = d.data()
        return { ...data, points: Number(data.points) || 1 } as Chore
      })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('chores'))
    unsubFns.push(unsub2)

    const unsub3 = onSnapshot(collection(db, 'completions'), (snap) => {
      completions = {}
      snap.docs.forEach((d) => { completions[d.id] = true })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('completions'))
    unsubFns.push(unsub3)

    const unsub4 = onSnapshot(collection(db, 'skipped'), (snap) => {
      skipped = {}
      snap.docs.forEach((d) => { skipped[d.id] = true })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('skipped'))
    unsubFns.push(unsub4)

    const unsub5a = onSnapshot(collection(db, 'pendingApprovals'), (snap) => {
      pendingApprovals = {}
      snap.docs.forEach((d) => { pendingApprovals[d.id] = true })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('pendingApprovals'))
    unsubFns.push(unsub5a)

    const unsub5 = onSnapshot(collection(db, 'rewards'), (snap) => {
      rewards = snap.docs.map((d) => d.data() as Reward)
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('rewards'))
    unsubFns.push(unsub5)

    const unsub6 = onSnapshot(collection(db, 'redemptions'), (snap) => {
      redemptions = snap.docs.map((d) => d.data() as Redemption)
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('redemptions'))
    unsubFns.push(unsub6)

    const unsub7 = onSnapshot(collection(db, 'coupons'), (snap) => {
      coupons = snap.docs.map((d) => d.data() as Coupon)
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('coupons'))
    unsubFns.push(unsub7)

    const unsub8 = onSnapshot(collection(db, 'achievements'), (snap) => {
      earnedBadges = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        earnedBadges[d.id] = (data.badgeIds as string[]) || []
      })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('achievements'))
    unsubFns.push(unsub8)

    const unsub9 = onSnapshot(collection(db, 'claimedBonuses'), (snap) => {
      claimedBonuses = {}
      snap.docs.forEach((d) => { claimedBonuses[d.id] = true })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('claimedBonuses'))
    unsubFns.push(unsub9)

    const unsub10 = onSnapshot(collection(db, 'stickers'), (snap) => {
      earnedStickersData = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        earnedStickersData[d.id] = (data.stickerIds as string[]) || []
      })
      if (initialLoad < TOTAL_COLLECTIONS) initialLoad++
      notify()
    }, handleError('stickers'))
    unsubFns.push(unsub10)
  })()

  return () => {
    cancelled = true
    unsubFns.forEach((fn) => fn())
  }
}

// ── Bulk push (local → Firestore) ──

export async function pushAllData(
  members: FamilyMember[],
  chores: Chore[],
  completions: CompletionRecord,
  skipped: SkippedRecord,
): Promise<void> {
  if (!useFirebase) return
  const db = await getFirebaseDb()
  const { doc, writeBatch } = await getFirestoreMethods()
  const batch = writeBatch(db)

  for (const member of members) {
    batch.set(doc(db, 'members', member.id), clean(member))
  }
  for (const chore of chores) {
    batch.set(doc(db, 'chores', chore.id), clean(chore))
  }
  for (const [key, value] of Object.entries(completions)) {
    if (!value) continue
    const parts = key.split(':')
    batch.set(doc(db, 'completions', key), {
      choreId: parts[0],
      memberId: parts[1],
      date: parts[2],
      done: true,
    })
  }
  for (const [key, value] of Object.entries(skipped)) {
    if (!value) continue
    const parts = key.split(':')
    batch.set(doc(db, 'skipped', key), {
      choreId: parts[0],
      memberId: parts[1],
      date: parts[2],
      skipped: true,
    })
  }

  await batch.commit()
}
