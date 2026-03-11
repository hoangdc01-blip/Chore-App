import { useMemberStore, getMemberColor } from '../../store/member-store'

export type StatusFilter = 'all' | 'done' | 'not-done' | 'overdue'

interface FilterBarProps {
  statusFilter: StatusFilter
  onStatusFilterChange: (filter: StatusFilter) => void
  hiddenMemberIds: Set<string>
  onToggleMember: (memberId: string) => void
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'done', label: 'Done' },
  { value: 'not-done', label: 'Not Done' },
  { value: 'overdue', label: 'Overdue' },
]

export default function FilterBar({ statusFilter, onStatusFilterChange, hiddenMemberIds, onToggleMember }: FilterBarProps) {
  const members = useMemberStore((s) => s.members)

  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-b border-border bg-background">
      {/* Status chips */}
      {STATUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onStatusFilterChange(opt.value)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            statusFilter === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}

      {/* Divider */}
      <div className="shrink-0 w-px bg-border self-stretch my-0.5" />

      {/* Kid chips */}
      {members.map((member) => {
        const color = getMemberColor(member)
        const hidden = hiddenMemberIds.has(member.id)
        return (
          <button
            key={member.id}
            onClick={() => onToggleMember(member.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              hidden
                ? 'bg-muted text-muted-foreground opacity-50'
                : `${color.bg} ${color.text}`
            }`}
          >
            {member.avatar ? (
              <img src={member.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <span className={`h-4 w-4 rounded-full ${color.dot} inline-flex items-center justify-center text-white text-[10px] font-bold`}>
                {member.name.charAt(0).toUpperCase()}
              </span>
            )}
            {member.name}
          </button>
        )
      })}
    </div>
  )
}
