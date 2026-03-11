interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
}

const CHORE_EMOJIS = [
  '🧹', '🍽️', '🛏️', '🧸', '🧺', '🪥', '🚿', '📚',
  '🐕', '🌱', '🗑️', '👕', '🧽', '🪣', '✏️', '🎒',
  '🧹', '🍳', '🥗', '🧃', '🎨', '🎵', '⚽', '🚲',
]

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`h-9 w-9 rounded-lg text-xs flex items-center justify-center transition-colors ${
          !value ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
        }`}
      >
        --
      </button>
      {CHORE_EMOJIS.map((emoji, i) => (
        <button
          key={`${emoji}-${i}`}
          type="button"
          onClick={() => onChange(emoji)}
          className={`h-9 w-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
            value === emoji ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted hover:bg-muted/80'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
