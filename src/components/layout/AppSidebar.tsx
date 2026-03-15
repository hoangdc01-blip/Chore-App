import { useState, useEffect } from 'react'
import {
  MessageCircle,
  Calendar,
  GraduationCap,
  BarChart3,
  Gamepad2,
  Gift,
  Languages,
  Ticket,
  Palette,
  Presentation,
  PencilLine,
  BookOpen,
  ArrowLeftRight,
  Moon,
  Sun,
  KeyRound,
  X,
  Star,
} from 'lucide-react'
import type { AppView } from '../../types'
import { useAppStore } from '../../store/app-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { useChatStore } from '../../store/chat-store'
import ChangePinDialog from '../auth/ChangePinDialog'
import AiAvatar from '../chat/AiAvatar'

interface AppSidebarProps {
  activeView: AppView
  onActiveViewChange: (view: AppView) => void
  open: boolean
  onClose: () => void
}

interface NavItem {
  view: AppView
  icon: typeof MessageCircle
  label: string
  kidOnly?: boolean
  parentOnly?: boolean
}

interface ToolItem {
  label: string
  icon: typeof Palette
  prefill: string
}

const AI_ASSISTANT_ITEMS: NavItem[] = [
  { view: 'chat', icon: MessageCircle, label: 'Chat' },
]

const AI_TOOLS: ToolItem[] = [
  { label: 'Coloring Pages', icon: Palette, prefill: 'I want a coloring page!' },
  { label: 'Presentations', icon: Presentation, prefill: 'I want to make a presentation!' },
  { label: 'Homework Help', icon: PencilLine, prefill: "Can you check my homework? I'm uploading a photo!" },
  { label: 'Bedtime Story', icon: BookOpen, prefill: 'Tell me a bedtime story' },
]

const FAMILY_ITEMS: NavItem[] = [
  { view: 'calendar', icon: Calendar, label: 'Chore Calendar' },
  { view: 'classes', icon: GraduationCap, label: 'Extra Classes' },
  { view: 'dashboard', icon: BarChart3, label: 'Dashboard', parentOnly: true },
  { view: 'rewards', icon: Gift, label: 'Rewards' },
  { view: 'coupons', icon: Ticket, label: 'Coupons', kidOnly: true },
]

const FUN_ITEMS: NavItem[] = [
  { view: 'games', icon: Gamepad2, label: 'Games' },
  { view: 'language', icon: Languages, label: 'Learn' },
]

export default function AppSidebar({ activeView, onActiveViewChange, open, onClose }: AppSidebarProps) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [changePinOpen, setChangePinOpen] = useState(false)

  const mode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const switchProfile = useAppStore((s) => s.switchProfile)
  const members = useMemberStore((s) => s.members)

  const isKidMode = mode === 'kid'
  const activeMember = isKidMode ? members.find((m) => m.id === activeKidId) : null
  const activeColor = activeMember ? getMemberColor(activeMember) : null

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const filterNav = (items: NavItem[]) => items.filter((item) => {
    if (item.kidOnly && !isKidMode) return false
    if (item.parentOnly && isKidMode) return false
    return true
  })

  const filteredAssistant = filterNav(AI_ASSISTANT_ITEMS)
  const filteredFamily = filterNav(FAMILY_ITEMS)
  const filteredFun = filterNav(FUN_ITEMS)

  const handleNavClick = (view: AppView) => {
    onActiveViewChange(view)
    onClose()
  }

  const handleToolClick = (prefill: string) => {
    onActiveViewChange('chat')
    // Pre-fill and send the message to chat
    setTimeout(() => {
      const store = useChatStore.getState()
      store.sendMessageStreaming(prefill)
    }, 100)
    onClose()
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border flex flex-col transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Header area with close button (mobile) */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <AiAvatar size="sm" />
          <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Vau Vau AI
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto px-3 py-2 flex flex-col gap-0.5">
          {/* AI Assistant */}
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            AI Assistant
          </p>
          {filteredAssistant.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => handleNavClick(view)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                activeView === view
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}

          <div className="border-t border-border my-3" />

          {/* Tools */}
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Tools
          </p>
          {AI_TOOLS.map(({ label, icon: Icon, prefill }) => (
            <button
              key={label}
              onClick={() => handleToolClick(prefill)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-muted transition-colors w-full text-left"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}

          <div className="border-t border-border my-3" />

          {/* Family */}
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Family
          </p>
          {filteredFamily.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => handleNavClick(view)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                activeView === view
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}

          <div className="border-t border-border my-3" />

          {/* Fun */}
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Fun
          </p>
          {filteredFun.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => handleNavClick(view)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                activeView === view
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Bottom section */}
        <div className="border-t border-border px-3 py-3 flex flex-col gap-1">
          {/* Kid profile card */}
          {isKidMode && activeMember && (
            <div className="mb-2 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${activeColor?.dot ?? 'bg-gray-400'} flex items-center justify-center overflow-hidden shadow-md`}>
                  {activeMember.avatar ? (
                    <img src={activeMember.avatar} alt={activeMember.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-lg font-bold">{activeMember.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{activeMember.name}</p>
                  <p className="text-xs text-amber-600 font-semibold flex items-center gap-0.5">
                    <Star size={12} fill="currentColor" />
                    {activeMember.points} points
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Night mode toggle */}
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

          {/* Change Passcode — parent only */}
          {!isKidMode && (
            <button
              onClick={() => setChangePinOpen(true)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <KeyRound size={15} />
              Change Passcode
            </button>
          )}

          {/* Switch profile */}
          <button
            onClick={() => { switchProfile(); onClose() }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeftRight size={15} />
            Switch Profile
          </button>
        </div>

        <ChangePinDialog open={changePinOpen} onClose={() => setChangePinOpen(false)} />
      </aside>
    </>
  )
}
