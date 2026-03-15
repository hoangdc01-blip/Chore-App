import { useState, useEffect, useRef } from 'react'
import { X, Camera } from 'lucide-react'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { type FamilyMember, EMOJI_OPTIONS } from '../../types'
import { resizeImageToDataURL } from '../../lib/image'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface MemberEditDialogProps {
  member: FamilyMember | null
  open: boolean
  onClose: () => void
}

export default function MemberEditDialog({ member, open, onClose }: MemberEditDialogProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open)
  const updateMember = useMemberStore((s) => s.updateMember)
  const updatePersonality = useMemberStore((s) => s.updatePersonality)
  const [name, setName] = useState('')
  const [colorIndex, setColorIndex] = useState(0)
  const [avatar, setAvatar] = useState<string | undefined>()
  const [emojiPasscode, setEmojiPasscode] = useState<string | undefined>()
  const [personalityNote, setPersonalityNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (member) {
      setName(member.name)
      setColorIndex(parseInt(member.color, 10) || 0)
      setAvatar(member.avatar)
      setEmojiPasscode(member.emojiPasscode)
      setPersonalityNote(member.personalityNote ?? '')
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
    updateMember(member.id, { name: trimmed, color: String(colorIndex), avatar, emojiPasscode })
    updatePersonality(member.id, personalityNote.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-edit-title"
        className="bg-background rounded-lg shadow-lg border border-border w-full max-w-[95vw] xl:max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 id="member-edit-title" className="font-semibold">Edit Kid Profile</h3>
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
                <img src={avatar} alt={name} className="h-24 w-24 xl:h-20 xl:w-20 rounded-full object-cover" />
              ) : (
                <div className={`h-24 w-24 xl:h-20 xl:w-20 rounded-full ${color.dot} flex items-center justify-center text-white text-2xl font-bold`}>
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
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Secret Emoji (passcode)</label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmojiPasscode(emojiPasscode === e ? undefined : e)}
                  className={`h-11 w-full rounded-lg text-xl flex items-center justify-center transition-all ${
                    emojiPasscode === e
                      ? 'bg-primary/15 ring-2 ring-primary scale-110'
                      : 'bg-muted hover:bg-accent'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {emojiPasscode ? `Selected: ${emojiPasscode}` : 'Optional — kid taps this emoji to log in'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Personality note</label>
            <Input
              type="text"
              value={personalityNote}
              onChange={(e) => setPersonalityNote(e.target.value)}
              placeholder="e.g., responds to praise, competitive, needs gentle reminders"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Helps Buddy adjust its tone when chatting with this kid
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim()}
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
