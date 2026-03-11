import MemberList from '../members/MemberList'
import MemberDialog from '../members/MemberDialog'
import { Users, X } from 'lucide-react'

interface SidebarProps {
  hiddenMemberIds: Set<string>
  onToggleMember: (memberId: string) => void
  open: boolean
  onClose: () => void
}

export default function Sidebar({ hiddenMemberIds, onToggleMember, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop — all screen sizes */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border p-4 flex flex-col gap-4 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Users size={16} />
            Kids
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <MemberList hiddenMemberIds={hiddenMemberIds} onToggleMember={onToggleMember} />
        <MemberDialog />
      </aside>
    </>
  )
}
