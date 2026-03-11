import { useState } from 'react'
import { X, Pencil, Trash2, EyeOff } from 'lucide-react'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import type { FamilyMember } from '../../types'
import MemberEditDialog from './MemberEditDialog'

interface MemberListProps {
  hiddenMemberIds: Set<string>
  onToggleMember: (memberId: string) => void
}

export default function MemberList({ hiddenMemberIds, onToggleMember }: MemberListProps) {
  const { members, removeMember } = useMemberStore()
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1">
        No kids yet. Add one below.
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
              className={`flex items-center justify-between rounded-md px-2 py-2 sm:py-1.5 hover:bg-muted group ${hiddenMemberIds.has(member.id) ? 'opacity-50' : ''}`}
            >
              <button
                onClick={() => onToggleMember(member.id)}
                className="flex items-center gap-2 flex-1 min-w-0 min-h-[36px]"
                title={hiddenMemberIds.has(member.id) ? 'Show chores' : 'Hide chores'}
              >
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} className="h-7 w-7 sm:h-6 sm:w-6 rounded-full object-cover shrink-0" />
                ) : (
                  <span className={`inline-flex items-center justify-center h-7 w-7 sm:h-6 sm:w-6 rounded-full shrink-0 ${color.dot} text-white text-[11px] sm:text-[10px] font-bold`}>
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="text-sm truncate">{member.name}</span>
                {hiddenMemberIds.has(member.id) && <EyeOff size={12} className="shrink-0 text-muted-foreground" />}
              </button>
              <div className="flex items-center gap-1.5 sm:gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingMember(member)}
                  className="text-muted-foreground hover:text-foreground p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Edit kid"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => {
                    if (confirmDeleteId === member.id) {
                      removeMember(member.id)
                      setConfirmDeleteId(null)
                    } else {
                      setConfirmDeleteId(member.id)
                    }
                  }}
                  className={`text-muted-foreground hover:text-destructive p-1 min-h-[36px] min-w-[36px] flex items-center justify-center ${confirmDeleteId === member.id ? 'text-destructive' : ''}`}
                  title={confirmDeleteId === member.id ? 'Click again to confirm' : 'Remove kid'}
                >
                  {confirmDeleteId === member.id ? <Trash2 size={15} /> : <X size={16} />}
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
