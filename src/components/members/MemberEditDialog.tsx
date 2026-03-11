import { useState, useEffect, useRef } from 'react'
import { X, Camera } from 'lucide-react'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { type FamilyMember, MEMBER_COLORS } from '../../types'
import { resizeImageToDataURL } from '../../lib/image'

interface MemberEditDialogProps {
  member: FamilyMember | null
  open: boolean
  onClose: () => void
}

export default function MemberEditDialog({ member, open, onClose }: MemberEditDialogProps) {
  const updateMember = useMemberStore((s) => s.updateMember)
  const [name, setName] = useState('')
  const [colorIndex, setColorIndex] = useState(0)
  const [avatar, setAvatar] = useState<string | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (member) {
      setName(member.name)
      setColorIndex(parseInt(member.color, 10) || 0)
      setAvatar(member.avatar)
    }
  }, [member])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !member) return null

  const color = getMemberColor({ ...member, color: String(colorIndex) })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizeImageToDataURL(file)
    setAvatar(dataUrl)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    updateMember(member.id, { name: trimmed, color: String(colorIndex), avatar })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-lg border border-border w-full max-w-[95vw] sm:max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Edit Kid Profile</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative group"
            >
              {avatar ? (
                <img src={avatar} alt={name} className="h-24 w-24 sm:h-20 sm:w-20 rounded-full object-cover" />
              ) : (
                <div className={`h-24 w-24 sm:h-20 sm:w-20 rounded-full ${color.dot} flex items-center justify-center text-white text-2xl font-bold`}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

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
                  className={`h-9 w-9 sm:h-7 sm:w-7 rounded-full ${c.dot} transition-all ${
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
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
