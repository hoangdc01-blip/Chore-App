import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useRewardStore } from '../../store/reward-store'
import { showToast } from '../../store/toast-store'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface RewardDialogProps {
  open: boolean
  onClose: () => void
}

const REWARD_EMOJIS = [
  '🍦', '🎬', '🎮', '🍕', '🧁', '🎪', '🏊', '🎨',
  '📱', '🛹', '🎠', '🧸', '🎁', '⭐', '🌈', '🎂',
]

export default function RewardDialog({ open, onClose }: RewardDialogProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open)
  const addReward = useRewardStore((s) => s.addReward)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎁')
  const [costStr, setCostStr] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setEmoji('🎁')
      setCostStr('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addReward({ name: name.trim(), emoji, cost: Math.max(1, parseInt(costStr) || 1) })
    showToast('Reward added!', 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-dialog-title"
        className="bg-background rounded-xl shadow-lg border border-border w-full max-w-[95vw] xl:max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 id="reward-dialog-title" className="font-semibold">Add Reward</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reward Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Ice cream treat"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <div className="flex flex-wrap gap-1.5">
              {REWARD_EMOJIS.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                    emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cost (points)</label>
            <Input
              type="text"
              inputMode="numeric"
              value={costStr}
              onChange={(e) => {
                const v = e.target.value
                if (v === '' || /^[1-9]\d*$/.test(v)) setCostStr(v)
              }}
              onBlur={() => { if (!costStr || parseInt(costStr) < 1) setCostStr('1') }}
              placeholder="Enter cost"
            />
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
              disabled={!name.trim() || !costStr}
            >
              Add Reward
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
