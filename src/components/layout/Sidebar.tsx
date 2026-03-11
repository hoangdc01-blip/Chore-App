import MemberList from '../members/MemberList'
import MemberDialog from '../members/MemberDialog'
import { Users, Download, Upload, X } from 'lucide-react'
import { useChoreStore } from '../../store/chore-store'
import { useMemberStore } from '../../store/member-store'

function exportData() {
  const chores = useChoreStore.getState().chores
  const completions = useChoreStore.getState().completions
  const members = useMemberStore.getState().members
  const skipped = useChoreStore.getState().skipped
  const data = JSON.stringify({ members, chores, completions, skipped }, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chores-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function importData() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.members && Array.isArray(data.members)) {
        useMemberStore.setState({ members: data.members })
      }
      if (data.chores && Array.isArray(data.chores)) {
        useChoreStore.setState({ chores: data.chores, completions: data.completions ?? {}, skipped: data.skipped ?? {} })
      }
    } catch {
      alert('Invalid backup file.')
    }
  }
  input.click()
}

interface SidebarProps {
  hiddenMemberIds: Set<string>
  onToggleMember: (memberId: string) => void
  open: boolean
  onClose: () => void
}

export default function Sidebar({ hiddenMemberIds, onToggleMember, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 sm:w-64 bg-background border-r border-border p-4 flex flex-col gap-4 transition-transform duration-200
          md:static md:translate-x-0 md:z-auto
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
            className="md:hidden rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <MemberList hiddenMemberIds={hiddenMemberIds} onToggleMember={onToggleMember} />
        <MemberDialog />
        <div className="mt-auto border-t border-border pt-3 flex gap-2">
          <button
            onClick={exportData}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
            title="Export data as JSON"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={importData}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-border px-2 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
            title="Import data from JSON backup"
          >
            <Upload size={16} />
            Import
          </button>
        </div>
      </aside>
    </>
  )
}
