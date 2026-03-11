import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useMemberStore } from '../../store/member-store'

export default function MemberDialog() {
  const [name, setName] = useState('')
  const addMember = useMemberStore((s) => s.addMember)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    addMember(trimmed)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New member name"
        className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        className="rounded-md bg-primary px-2 py-1.5 text-primary-foreground hover:bg-primary/90 transition-colors"
        title="Add member"
      >
        <Plus size={16} />
      </button>
    </form>
  )
}
