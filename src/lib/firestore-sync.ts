import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import type { FamilyMember, Chore, CompletionRecord, SkippedRecord } from '../types'

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
  const snap = await getDocs(collection(db, 'members'))
  return snap.docs.map((d) => d.data() as FamilyMember)
}

export async function saveMember(member: FamilyMember): Promise<void> {
  await setDoc(doc(db, 'members', member.id), clean(member))
}

export async function deleteMemberDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'members', id))
}

export async function updateMemberDoc(id: string, updates: Partial<FamilyMember>): Promise<void> {
  await setDoc(doc(db, 'members', id), clean(updates), { merge: true })
}

// ── Chores ──

export async function fetchChores(): Promise<Chore[]> {
  const snap = await getDocs(collection(db, 'chores'))
  return snap.docs.map((d) => d.data() as Chore)
}

export async function saveChore(chore: Chore): Promise<void> {
  await setDoc(doc(db, 'chores', chore.id), clean(chore))
}

export async function deleteChoreDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'chores', id))
}

export async function deleteChoresByMemberDocs(memberId: string): Promise<void> {
  const q = query(collection(db, 'chores'), where('assigneeId', '==', memberId))
  const snap = await getDocs(q)
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

export async function updateChoreDoc(id: string, updates: Partial<Chore>): Promise<void> {
  await setDoc(doc(db, 'chores', id), clean(updates), { merge: true })
}

// ── Completions ──

export async function fetchCompletions(): Promise<CompletionRecord> {
  const snap = await getDocs(collection(db, 'completions'))
  const record: CompletionRecord = {}
  snap.docs.forEach((d) => {
    record[d.id] = true
  })
  return record
}

export async function setCompletion(key: string, choreId: string, memberId: string, date: string): Promise<void> {
  await setDoc(doc(db, 'completions', key), { choreId, memberId, date, done: true })
}

export async function removeCompletion(key: string): Promise<void> {
  await deleteDoc(doc(db, 'completions', key))
}

// ── Skipped ──

export async function fetchSkipped(): Promise<SkippedRecord> {
  const snap = await getDocs(collection(db, 'skipped'))
  const record: SkippedRecord = {}
  snap.docs.forEach((d) => {
    record[d.id] = true
  })
  return record
}

export async function setSkipped(key: string, choreId: string, memberId: string, date: string): Promise<void> {
  await setDoc(doc(db, 'skipped', key), { choreId, memberId, date, skipped: true })
}

export async function removeSkipped(key: string): Promise<void> {
  await deleteDoc(doc(db, 'skipped', key))
}

// ── Bulk fetch ──

export async function fetchAllData(): Promise<{
  members: FamilyMember[]
  chores: Chore[]
  completions: CompletionRecord
  skipped: SkippedRecord
}> {
  const [members, chores, completions, skipped] = await Promise.all([
    fetchMembers(),
    fetchChores(),
    fetchCompletions(),
    fetchSkipped(),
  ])
  return { members, chores, completions, skipped }
}
