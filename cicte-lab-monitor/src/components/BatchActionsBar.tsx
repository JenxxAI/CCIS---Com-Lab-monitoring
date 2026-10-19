import { useState, useRef } from 'react'
import { CheckSquare, X, Monitor, Wrench, AlertTriangle, ChevronDown } from 'lucide-react'
import { useLabStore, useThemeStore, useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import { STATUS_META, COND_META } from '@/lib/utils'
import { toast } from '@/store/toast'
import { useUpdatePC } from '@/hooks/useApi'
import { logActivity } from '@/store/activity'
import type { PCStatus, PCCondition } from '@/types'

// ─── Batch Actions Floating Bar ──────────────────────────────────────────────
// Appears at the bottom of the screen when PCs are multi-selected.

export function BatchActionsBar() {
  const { dark } = useThemeStore()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const {
    selectedPCIds, clearSelection,
    labData, activeLab,
  } = useLabStore()
  const user = useAuthStore(s => s.user)

  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showCondMenu, setShowCondMenu]   = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'status' | 'condition'
    value: PCStatus | PCCondition
    label: string
  } | null>(null)

  const mutation = useUpdatePC()
  const running = useRef(false)
  const [pending, setPending] = useState(false)

  const count = selectedPCIds.size
  if (count === 0 || !isAdmin) return null

  const handleStatusChange = (status: PCStatus) => {
    setShowStatusMenu(false)
    setConfirmAction({ type: 'status', value: status, label: STATUS_META[status].label })
  }

  const handleConditionChange = (condition: PCCondition) => {
    setShowCondMenu(false)
    setConfirmAction({ type: 'condition', value: condition, label: COND_META[condition].label })
  }

  const executeAction = async () => {
    if (!confirmAction || running.current) return
    running.current = true
    setPending(true)
    const affected = (labData[activeLab] ?? []).filter(p => selectedPCIds.has(p.id))
    const failed = new Set<string>()
    for (const pc of affected) {
      try {
        const changes = confirmAction.type === 'status'
          ? { status: confirmAction.value as PCStatus }
          : { condition: confirmAction.value as PCCondition }
        await mutation.mutateAsync({ id: pc.id, labId: pc.labId, ...changes })
        logActivity({
          pcId: pc.id, labId: pc.labId,
          type: confirmAction.type === 'status' ? 'status-change' : 'condition-change',
          title: `${confirmAction.type} → ${confirmAction.label} (batch)`,
          description: 'Saved to the server', performedBy: user?.name ?? 'Unknown',
        })
      } catch {
        failed.add(pc.id)
      }
    }
    if (useLabStore.getState().activeLab === activeLab) {
      useLabStore.setState({ selectedPCIds: failed })
    }
    const saved = affected.length - failed.size
    if (saved) toast.success(`${saved} PC${saved > 1 ? 's' : ''} updated`)
    if (failed.size) toast.error(`${failed.size} PC${failed.size > 1 ? 's' : ''} could not be saved. Select Apply to retry.`)
    else setConfirmAction(null)
    running.current = false
    setPending(false)
  }

  const accent = dark ? '#5b7fff' : '#3a5cf5'

  return (
    <>
      {/* Floating bar */}
      <div className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 px-4 py-2.5 rounded-2xl',
        'border shadow-2xl animate-fade-in',
        dark
          ? 'bg-dark-surface border-dark-border shadow-black/50'
          : 'bg-white border-slate-200 shadow-slate-300/50'
      )}>
        {/* Selection count */}
        <div className="flex items-center gap-1.5">
          <CheckSquare size={14} style={{ color: accent }} />
          <span className={cn('text-[12px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
            {count} selected
          </span>
        </div>

        <div className={cn('w-px h-5', dark ? 'bg-dark-border' : 'bg-slate-200')} />

        {/* Status dropdown */}
        <div className="relative">
          <button
            disabled={pending}
            onClick={() => { setShowStatusMenu(o => !o); setShowCondMenu(false) }}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors',
              dark
                ? 'border-dark-border text-slate-300 hover:bg-dark-surfaceAlt'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Monitor size={12} />
            Set Status
            <ChevronDown size={10} />
          </button>

          {showStatusMenu && (
            <div className={cn(
              'absolute bottom-full mb-1 left-0 w-44 rounded-xl border shadow-lg overflow-hidden z-10',
              dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
            )}>
              {(['available', 'occupied', 'maintenance'] as PCStatus[]).map(st => {
                const meta = STATUS_META[st]
                return (
                  <button
            disabled={pending}
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors',
                      dark ? 'hover:bg-dark-surfaceAlt text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Condition dropdown */}
        <div className="relative">
          <button
            disabled={pending}
            onClick={() => { setShowCondMenu(o => !o); setShowStatusMenu(false) }}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors',
              dark
                ? 'border-dark-border text-slate-300 hover:bg-dark-surfaceAlt'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Wrench size={12} />
            Set Condition
            <ChevronDown size={10} />
          </button>

          {showCondMenu && (
            <div className={cn(
              'absolute bottom-full mb-1 left-0 w-48 rounded-xl border shadow-lg overflow-hidden z-10',
              dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
            )}>
              {(['good', 'lagging', 'needs_repair', 'damaged'] as PCCondition[]).map(c => {
                const meta = COND_META[c]
                return (
                  <button
            disabled={pending}
                    key={c}
                    onClick={() => handleConditionChange(c)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left transition-colors',
                      dark ? 'hover:bg-dark-surfaceAlt text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className={cn('w-px h-5', dark ? 'bg-dark-border' : 'bg-slate-200')} />

        {/* Clear */}
        <button
            disabled={pending}
          onClick={clearSelection}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            dark ? 'text-slate-500 hover:text-slate-300 hover:bg-dark-surfaceAlt' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          )}
          title="Clear selection"
        >
          <X size={14} />
        </button>
      </div>

      {/* Confirmation overlay */}
      {confirmAction && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 animate-fade-in">
          <div className={cn(
            'w-[380px] rounded-2xl p-6 border shadow-2xl',
            dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
          )}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className={cn('text-[14px] font-semibold', dark ? 'text-slate-100' : 'text-slate-900')}>
                Confirm Batch {confirmAction.type === 'status' ? 'Status' : 'Condition'} Change
              </h3>
            </div>

            <p className={cn('text-[12px] mb-5', dark ? 'text-slate-400' : 'text-slate-500')}>
              This will change the <strong>{confirmAction.type}</strong> of <strong>{count} PC{count > 1 ? 's' : ''}</strong> to <strong>{confirmAction.label}</strong>.
              This action can be individually reverted but not bulk-undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
            disabled={pending}
                onClick={() => setConfirmAction(null)}
                className={cn(
                  'px-4 py-2 rounded-lg text-[12px] font-medium border transition-colors',
                  dark ? 'border-dark-border text-slate-400 hover:bg-dark-surfaceAlt' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                )}
              >
                Cancel
              </button>
              <button
            disabled={pending}
                onClick={executeAction}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white transition-colors"
                style={{ backgroundColor: accent }}
              >
                {pending ? 'Saving…' : `Apply to ${count} PC${count > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
