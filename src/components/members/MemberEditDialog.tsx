import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useMemberStore } from '../../store/member-store'
import { type TeamMember, MEMBER_COLORS } from '../../types'

interface MemberEditDialogProps {
  member: TeamMember | null
  open: boolean
  onClose: () => void
}

export default function MemberEditDialog({ member, open, onClose }: MemberEditDialogProps) {
  const updateMember = useMemberStore((s) => s.updateMember)
  const [name, setName] = useState('')
  const [colorIndex, setColorIndex] = useState(0)

  useEffect(() => {
    if (member) {
      setName(member.name)
      setColorIndex(parseInt(member.color, 10) || 0)
    }
  }, [member])

  if (!open || !member) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    updateMember(member.id, { name: trimmed, color: String(colorIndex) })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-lg border border-border w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Edit Member</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {MEMBER_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  className={`h-7 w-7 rounded-full ${c.dot} transition-all ${
                    colorIndex === i
                      ? 'ring-2 ring-ring ring-offset-2'
                      : 'hover:ring-2 hover:ring-ring/50 hover:ring-offset-1'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
