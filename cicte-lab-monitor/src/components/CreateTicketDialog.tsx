import { useState } from 'react'
import { X } from 'lucide-react'
import { useThemeStore, useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import type { TicketPriority } from '@/types'
import { PRIORITY_META, createTicket, useTicketStore } from '@/store/tickets'
import { logActivity } from '@/store/activity'
import { toast } from '@/store/toast'
import { LABS } from '@/lib/data'

const VOLUNTEERS = ['Admin Ramos', 'Vol. Dela Rosa', 'Vol. Aquino', 'Tech. Magsino']

interface Props {
  open:    boolean
  pcId:    string
  labId:   string
  pcNum:   number
  onClose: () => void
}

export function CreateTicketDialog({ open, pcId, labId, pcNum, onClose }: Props) {
  const { dark } = useThemeStore()
  const user = useAuthStore(s => s.user)
  const addTicket = useTicketStore(s => s.addTicket)

  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]     = useState<TicketPriority>('medium')
  const [assignedTo, setAssignedTo] = useState(VOLUNTEERS[0])
  const [estMinutes, setEstMinutes] = useState(30)

  if (!open) return null

  const labName = LABS.find(l => l.id === labId)?.name ?? labId

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const ticket = createTicket({
      pcId,
      labId,
      title: title.trim(),
      description: description.trim(),
      priority,
      assignedTo,
      estimatedMinutes: estMinutes,
      createdBy: user?.name ?? 'Unknown',
    })

    addTicket(ticket)

    logActivity({
      pcId,
      labId,
      type: 'ticket-created',
      title: `Ticket created: ${title.trim()}`,
      description: `Priority: ${PRIORITY_META[priority].label} · Assigned: ${assignedTo}`,
      performedBy: user?.name ?? 'Unknown',
      metadata: { ticketId: ticket.id },
    })

    toast.success(`Ticket created for PC-${String(pcNum).padStart(2, '0')}`)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setAssignedTo(VOLUNTEERS[0])
    setEstMinutes(30)
  }

  const inputCls = cn(
    'w-full rounded-lg border px-3 py-2 text-[12px] outline-none transition-colors',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 focus:border-accent placeholder:text-slate-600'
      : 'bg-white border-slate-200 text-slate-700 focus:border-blue-400 placeholder:text-slate-400'
  )

  const labelCls = cn('block text-[11px] font-medium mb-1', dark ? 'text-slate-400' : 'text-slate-500')

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border shadow-2xl animate-fade-in',
          dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between px-5 py-3.5 border-b',
          dark ? 'border-dark-border' : 'border-slate-100'
        )}>
          <div>
            <h2 className={cn('text-sm font-semibold', dark ? 'text-slate-100' : 'text-slate-900')}>
              Create Repair Ticket
            </h2>
            <p className={cn('text-[11px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
              PC-{String(pcNum).padStart(2, '0')} · {labName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
              dark ? 'hover:bg-dark-surfaceAlt text-slate-500' : 'hover:bg-slate-100 text-slate-400'
            )}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3.5">
          {/* Title */}
          <div>
            <label className={labelCls}>Issue Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. RAM not detected, Blue screen on boot..."
              className={inputCls}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              className={cn(inputCls, 'resize-none')}
            />
          </div>

          {/* Priority + Estimated time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Priority</label>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high', 'critical'] as TicketPriority[]).map(p => {
                  const meta = PRIORITY_META[p]
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-[10px] font-medium border transition-all',
                        priority === p
                          ? 'ring-1 ring-offset-1'
                          : (dark ? 'border-dark-border text-slate-500' : 'border-slate-200 text-slate-400'),
                        dark && 'ring-offset-dark-surface'
                      )}
                      style={priority === p ? {
                        borderColor: meta.color,
                        color: meta.color,
                        backgroundColor: meta.bg,
                        // @ts-expect-error CSS custom property
                        '--tw-ring-color': meta.color,
                      } : undefined}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelCls}>Est. Time (min)</label>
              <input
                type="number"
                value={estMinutes}
                onChange={e => setEstMinutes(Number(e.target.value))}
                min={5}
                max={480}
                step={5}
                className={inputCls}
              />
            </div>
          </div>

          {/* Assigned to */}
          <div>
            <label className={labelCls}>Assign To</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className={inputCls}
            >
              {VOLUNTEERS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className={cn(
          'flex justify-end gap-2 px-5 py-3 border-t',
          dark ? 'border-dark-border' : 'border-slate-100'
        )}>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'px-4 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
              dark
                ? 'text-slate-400 hover:bg-dark-surfaceAlt'
                : 'text-slate-500 hover:bg-slate-100'
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className={cn(
              'px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors',
              'bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            style={{ backgroundColor: dark ? '#5b7fff' : '#3a5cf5' }}
          >
            Create Ticket
          </button>
        </div>
      </form>
    </div>
  )
}
