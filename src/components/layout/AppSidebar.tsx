import { useState, useEffect } from 'react'
import {
  MessageCircle,
  MessageSquare,
  Calendar,
  GraduationCap,
  BarChart3,
  Gamepad2,
  Gift,
  Languages,
  Music,
  Ticket,
  ArrowLeftRight,
  Moon,
  Sun,
  Users,
  X,
  Star,
  Plus,
} from 'lucide-react'
import type { AppView } from '../../types'
import { useAppStore } from '../../store/app-store'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import { useChatStore } from '../../store/chat-store'
import { cn } from '../../lib/utils'
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

const AI_ASSISTANT_ITEMS: NavItem[] = [
  { view: 'chat', icon: MessageCircle, label: 'Chat' },
]

const FAMILY_ITEMS: NavItem[] = [
  { view: 'calendar', icon: Calendar, label: 'Chore Calendar' },
  { view: 'classes', icon: GraduationCap, label: 'Extra Classes' },
  { view: 'dashboard', icon: BarChart3, label: 'Dashboard', parentOnly: true },
  { view: 'rewards', icon: Gift, label: 'Rewards' },
  { view: 'coupons', icon: Ticket, label: 'Coupons', kidOnly: true },
  { view: 'members', icon: Users, label: 'Manage Family', parentOnly: true },
]

const FUN_ITEMS: NavItem[] = [
  { view: 'games', icon: Gamepad2, label: 'Games' },
  { view: 'language', icon: Languages, label: 'Learn' },
  { view: 'music', icon: Music, label: 'Music' },
]

export default function AppSidebar({ activeView, onActiveViewChange, open, onClose }: AppSidebarProps) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  const mode = useAppStore((s) => s.mode)
  const activeKidId = useAppStore((s) => s.activeKidId)
  const switchProfile = useAppStore((s) => s.switchProfile)
  const members = useMemberStore((s) => s.members)

  const chatHistory = useChatStore(s => s.chatHistory)
  const activeSessionId = useChatStore(s => s.activeSessionId)
  const startNewChat = useChatStore(s => s.startNewChat)
  const loadSession = useChatStore(s => s.loadSession)
  const deleteSession = useChatStore(s => s.deleteSession)
  const selectedMemberId = useChatStore(s => s.selectedMemberId)

  const isKidMode = mode === 'kid'
  const activeMember = isKidMode ? members.find((m) => m.id === activeKidId) : null
  const activeColor = activeMember ? getMemberColor(activeMember) : null

  const effectiveMemberId = isKidMode ? activeKidId : selectedMemberId
  const filteredSessions = chatHistory
    .filter(s => s.memberId === effectiveMemberId || s.memberId === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

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
          <span className="text-lg font-extrabold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Váu Váu
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-colors w-full text-left ${
                activeView === view
                  ? 'bg-primary/12 text-primary font-bold'
                  : 'text-foreground/70 hover:text-foreground hover:bg-primary/5'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}

          {/* Chat History */}
          {activeView === 'chat' && (
            <div className="ml-2 mt-0.5 space-y-0.5">
              <button
                onClick={() => { startNewChat(); onActiveViewChange('chat'); onClose() }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-primary hover:bg-primary/10 transition-colors w-full text-left"
              >
                <Plus size={13} />
                New Chat
              </button>
              {filteredSessions.slice(0, 10).map(session => (
                <button
                  key={session.id}
                  onClick={() => { loadSession(session.id); onActiveViewChange('chat'); onClose() }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-colors w-full text-left group',
                    session.id === activeSessionId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <MessageSquare size={12} className="shrink-0" />
                  <span className="truncate flex-1">{session.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-all"
                    aria-label="Delete"
                  >
                    <X size={10} />
                  </button>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border my-3" />

          {/* Family */}
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Family
          </p>
          {filteredFamily.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => handleNavClick(view)}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-colors w-full text-left ${
                activeView === view
                  ? 'bg-primary/12 text-primary font-bold'
                  : 'text-foreground/70 hover:text-foreground hover:bg-primary/5'
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
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-colors w-full text-left ${
                activeView === view
                  ? 'bg-primary/12 text-primary font-bold'
                  : 'text-foreground/70 hover:text-foreground hover:bg-primary/5'
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
                <div className={`w-10 h-10 rounded-full ${activeColor?.dot ?? 'bg-muted-foreground'} flex items-center justify-center overflow-hidden shadow-md`}>
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
            role="switch"
            aria-checked={dark}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              {dark ? <Sun size={15} /> : <Moon size={15} />}
              Night Mode
            </div>
            <div
              className={`w-9 h-5 rounded-full transition-colors relative ${
                dark ? 'bg-purple-500' : 'bg-muted-foreground/40'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                  dark ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>

          {/* Switch profile */}
          <button
            onClick={() => { switchProfile(); onClose() }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeftRight size={15} />
            Switch Profile
          </button>
        </div>

      </aside>
    </>
  )
}
