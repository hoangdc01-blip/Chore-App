import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import type { TeamMember } from '../../types'
import MemberEditDialog from './MemberEditDialog'

export default function MemberList() {
  const { members, removeMember } = useMemberStore()
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1">
        No team members yet. Add one below.
      </p>
    )
  }

  return (
    <>
      <ul className="space-y-1">
        {members.map((member) => {
          const color = getMemberColor(member)
          return (
            <li
              key={member.id}
              className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted group"
            >
              <div className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${color.dot}`} />
                <span className="text-sm">{member.name}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingMember(member)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit member"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Remove member"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <MemberEditDialog
        member={editingMember}
        open={!!editingMember}
        onClose={() => setEditingMember(null)}
      />
    </>
  )
}
