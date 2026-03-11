import MemberList from '../members/MemberList'
import MemberDialog from '../members/MemberDialog'
import { Users } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        <Users size={16} />
        Team Members
      </div>
      <MemberList />
      <MemberDialog />
    </aside>
  )
}
