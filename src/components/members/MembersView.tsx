import { useState } from 'react'
import { Plus, Pencil, KeyRound, Trash2, Shield } from 'lucide-react'
import { useMemberStore, getMemberColor } from '../../store/member-store'
import MemberDialog from './MemberDialog'
import MemberEditDialog from './MemberEditDialog'
import ChangePinDialog from '../auth/ChangePinDialog'
import type { FamilyMember } from '../../types'
import { cn } from '../../lib/utils'

export default function MembersView() {
  const [addOpen, setAddOpen] = useState(false)
  const [editMember, setEditMember] = useState<FamilyMember | null>(null)
  const [changePinOpen, setChangePinOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const members = useMemberStore((s) => s.members)
  const removeMember = useMemberStore((s) => s.removeMember)

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      removeMember(id)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(id)
      setTimeout(() => setConfirmDelete(null), 3000)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-lg font-bold text-foreground">Manage Family</h2>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Kid
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Admin Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Admin</h3>
            <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Parent Account</p>
                  <p className="text-xs text-muted-foreground">4-digit PIN passcode</p>
                </div>
              </div>
              <button
                onClick={() => setChangePinOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-accent text-foreground transition-colors"
              >
                <KeyRound size={14} />
                Change PIN
              </button>
            </div>
          </div>

          {/* Kids Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Kids ({members.length})
            </h3>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-card border border-border text-center">
                <p className="text-muted-foreground mb-4">No kids added yet</p>
                <button
                  onClick={() => setAddOpen(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
                >
                  Add your first kid
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const color = getMemberColor(member)
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                    >
                      <div className={cn('w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shadow-sm shrink-0', color.dot)}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-lg font-bold">{member.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm">{member.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{member.points ?? 0} pts</span>
                          {member.emojiPasscode ? (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                              <KeyRound size={10} />
                              Password set
                            </span>
                          ) : (
                            <span className="text-xs text-amber-500">No password</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditMember(member)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit kid"
                        aria-label={`Edit ${member.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          confirmDelete === member.id
                            ? 'text-white bg-destructive'
                            : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                        )}
                        title={confirmDelete === member.id ? 'Click again to confirm' : 'Delete kid'}
                        aria-label={confirmDelete === member.id ? `Confirm delete ${member.name}` : `Delete ${member.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <MemberDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {editMember && (
        <MemberEditDialog
          member={editMember}
          open={!!editMember}
          onClose={() => setEditMember(null)}
        />
      )}
      <ChangePinDialog open={changePinOpen} onClose={() => setChangePinOpen(false)} />
    </div>
  )
}
