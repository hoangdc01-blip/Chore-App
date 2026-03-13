import { useState, useEffect, useRef } from 'react'
import { Plus, X, Camera } from 'lucide-react'
import { useMemberStore } from '../../store/member-store'
import { MEMBER_COLORS, EMOJI_OPTIONS } from '../../types'
import { resizeImageToDataURL } from '../../lib/image'
import { useFocusTrap } from '../../hooks/useFocusTrap'

export default function MemberDialog() {
  const addMember = useMemberStore((s) => s.addMember)
  const members = useMemberStore((s) => s.members)
  const [open, setOpen] = useState(false)
  const trapRef = useFocusTrap<HTMLDivElement>(open)
  const [name, setName] = useState('')
  const [colorIndex, setColorIndex] = useState(0)
  const [avatar, setAvatar] = useState<string | undefined>()
  const [emojiPasscode, setEmojiPasscode] = useState<string | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setColorIndex(members.length % MEMBER_COLORS.length)
      setAvatar(undefined)
      setEmojiPasscode(undefined)
    }
  }, [open, members.length])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const color = MEMBER_COLORS[colorIndex] ?? MEMBER_COLORS[0]

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
    addMember(trimmed, avatar, String(colorIndex))
    if (emojiPasscode) {
      // Get the just-added member (last in list after state update)
      setTimeout(() => {
        const members = useMemberStore.getState().members
        const added = members[members.length - 1]
        if (added && added.name === trimmed) {
          useMemberStore.getState().updateMember(added.id, { emojiPasscode })
        }
      }, 50)
    }
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[44px] w-full mt-2"
      >
        <Plus size={16} />
        Add Kid
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-dialog-title"
            className="bg-background rounded-lg shadow-lg border border-border w-full max-w-[95vw] xl:max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 id="member-dialog-title" className="font-semibold">Add Kid</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
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
                    <img src={avatar} alt={name || 'Avatar'} className="h-24 w-24 xl:h-20 xl:w-20 rounded-full object-cover" />
                  ) : (
                    <div className={`h-24 w-24 xl:h-20 xl:w-20 rounded-full ${color.dot} flex items-center justify-center text-white text-2xl font-bold`}>
                      {name ? name.charAt(0).toUpperCase() : '?'}
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
                  placeholder="Kid's name"
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
                      className={`h-9 w-9 xl:h-7 xl:w-7 rounded-full ${c.dot} transition-all ${
                        colorIndex === i
                          ? 'ring-2 ring-ring ring-offset-2'
                          : 'hover:ring-2 hover:ring-ring/50 hover:ring-offset-1'
                      }`}
                    />
                  ))}
                </div>
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
