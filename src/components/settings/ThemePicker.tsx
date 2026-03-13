import { KID_THEMES } from '../../lib/kid-themes'
import { useMemberStore } from '../../store/member-store'
import { useAppStore } from '../../store/app-store'

export default function ThemePicker() {
  const activeKidId = useAppStore((s) => s.activeKidId)
  const members = useMemberStore((s) => s.members)
  const updateMember = useMemberStore((s) => s.updateMember)

  if (!activeKidId) return null
  const member = members.find((m) => m.id === activeKidId)
  if (!member) return null

  const currentTheme = member.theme ?? 'default'

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold text-muted-foreground">Theme</h4>
      <div className="flex flex-wrap gap-2">
        {KID_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => updateMember(member.id, { theme: theme.id })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
              currentTheme === theme.id
                ? 'bg-primary text-primary-foreground scale-105 shadow-md'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:scale-105'
            }`}
            title={theme.name}
          >
            <span>{theme.emoji}</span>
            <span className="hidden sm:inline">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
