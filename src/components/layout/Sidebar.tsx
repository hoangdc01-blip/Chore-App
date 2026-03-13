import { useState, useEffect } from 'react'
import MemberList from '../members/MemberList'
import MemberDialog from '../members/MemberDialog'
import { Users, X, KeyRound, Moon, Sun, ArrowLeftRight } from 'lucide-react'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { useAppStore } from '../../store/app-store'
import ChangePinDialog from '../auth/ChangePinDialog'
import ThemePicker from '../settings/ThemePicker'

interface SidebarProps {
  hiddenMemberIds: Set<string>
  onToggleMember: (memberId: string) => void
  open: boolean
  onClose: () => void
}

export default function Sidebar({ hiddenMemberIds, onToggleMember, open, onClose }: SidebarProps) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [changePinOpen, setChangePinOpen] = useState(false)
  const members = useMemberStore((s) => s.members)
  const mode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const switchProfile = useAppStore((s) => s.switchProfile)

  const isKidMode = mode === 'kid'
  const activeMember = isKidMode ? members.find((m) => m.id === activeKidId) : null
  const activeColor = activeMember ? getMemberColor(activeMember) : null

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border p-4 flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Users size={16} />
            {isKidMode ? 'My Profile' : 'Kids'}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Kid mode: show own profile */}
        {isKidMode && activeMember && (
          <div className="mb-4 pb-4 border-b border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className={`w-12 h-12 rounded-full ${activeColor?.dot ?? 'bg-gray-400'} flex items-center justify-center overflow-hidden shadow-md`}>
                {activeMember.avatar ? (
                  <img src={activeMember.avatar} alt={activeMember.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xl font-bold">{activeMember.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">{activeMember.name}</p>
                <p className="text-sm text-amber-600 font-semibold">⭐ {activeMember.points} points</p>
              </div>
            </div>
          </div>
        )}

        {/* Parent mode: Kids list + add button */}
        {!isKidMode && (
          <div className="flex-1 flex flex-col gap-4 overflow-auto min-h-0">
            <MemberList hiddenMemberIds={hiddenMemberIds} onToggleMember={onToggleMember} />
            <MemberDialog />
          </div>
        )}

        {/* Kid mode: theme picker + spacer */}
        {isKidMode && (
          <div className="flex-1 flex flex-col gap-4">
            <ThemePicker />
          </div>
        )}

        {/* Bottom actions */}
        <div className="border-t border-border pt-3 mt-3 flex flex-col gap-1">
          {/* Switch Profile — always available */}
          <button
            onClick={() => { switchProfile(); onClose() }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeftRight size={15} />
            Switch Profile
          </button>

          {/* Parent-only settings */}
          {!isKidMode && (
            <>
              <button
                onClick={() => setChangePinOpen(true)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <KeyRound size={15} />
                Change Passcode
              </button>

            </>
          )}

          {/* Night mode — available for everyone */}
          <button
            onClick={() => setDark((d) => !d)}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
              Night Mode
            </div>
            <div
              className={`w-9 h-5 rounded-full transition-colors relative ${
                dark ? 'bg-purple-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  dark ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        </div>

        <ChangePinDialog open={changePinOpen} onClose={() => setChangePinOpen(false)} />
      </aside>
    </>
  )
}
