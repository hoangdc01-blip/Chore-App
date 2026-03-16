import { Check, X, Calendar, Star, Clock, RotateCw } from 'lucide-react'
import type { ChoreAction } from '../../types'
import { getMemberNameById } from '../../lib/chat-actions'

interface Props {
  action: ChoreAction
  onAccept: () => void
  onCancel: () => void
}

export default function ChoreConfirmCard({ action, onAccept, onCancel }: Props) {
  const memberName = getMemberNameById(action.assigneeId)

  return (
    <div className="bg-card border border-border rounded-2xl p-3 mb-3 ml-10 animate-fade-in-up">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
        New Chore
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{action.emoji || '📋'}</span>
        <span className="font-bold text-foreground">{action.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <span>👤</span> {memberName}
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={12} /> {action.startDate}
        </div>
        <div className="flex items-center gap-1">
          <Star size={12} /> {action.points} {action.points === 1 ? 'point' : 'points'}
        </div>
        {action.startTime && (
          <div className="flex items-center gap-1">
            <Clock size={12} /> {action.startTime}
          </div>
        )}
        {action.recurrence !== 'none' && (
          <div className="flex items-center gap-1">
            <RotateCw size={12} /> {action.recurrence}
          </div>
        )}
      </div>
      {action.description && (
        <p className="text-xs text-muted-foreground mb-3 italic">{action.description}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 text-sm font-bold transition-colors"
        >
          <Check size={14} /> Add it!
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-border hover:bg-muted text-foreground py-2 text-sm font-medium transition-colors"
        >
          <X size={14} /> Nah
        </button>
      </div>
    </div>
  )
}
