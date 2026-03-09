import { useState } from 'react'
import { X, Plus, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore, useAuthStore } from '@/store'
import { LABS } from '@/lib/data'
import { useAddPC } from '@/hooks/useApi'
import { toast } from '@/store/toast'

interface Props {
  open:         boolean
  onClose:      () => void
  defaultLabId?: string
}

export function AddPCDialog({ open, onClose, defaultLabId }: Props) {
  const { dark }   = useThemeStore()
  const activeLab  = useAuthStore(s => s.user)  // just to re-render on auth changes
  void activeLab
  const addPC      = useAddPC()

  const [labId, setLabId] = useState(defaultLabId ?? 'cl1')
  const [num, setNum]     = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pcNum = parseInt(num, 10)
    if (!labId || isNaN(pcNum) || pcNum < 1 || pcNum > 60) {
      toast.error('Enter a valid lab and PC number (1–60)')
      return
    }
    try {
      await addPC.mutateAsync({ labId, num: pcNum })
      toast.success(`PC-${String(pcNum).padStart(2, '0')} added to ${labId.toUpperCase()}`)
      setNum('')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add PC')
    }
  }

  const inputClass = cn(
    'w-full px-3 py-2 rounded-lg border text-[12px] outline-none',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
  )

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative z-10 w-full max-w-sm mx-4 rounded-2xl border shadow-2xl p-6',
        dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
      )}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Monitor size={16} className={dark ? 'text-accent' : 'text-blue-600'} />
            <h2 className={cn('text-[15px] font-semibold', dark ? 'text-slate-100' : 'text-slate-900')}>
              Add PC
            </h2>
          </div>
          <button onClick={onClose}
            className={cn('w-7 h-7 rounded-lg flex items-center justify-center',
              dark ? 'hover:bg-dark-surfaceAlt text-slate-500' : 'hover:bg-slate-100 text-slate-400')}>
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={cn('block text-[11px] font-medium mb-1', dark ? 'text-slate-400' : 'text-slate-600')}>
              Laboratory
            </label>
            <select value={labId} onChange={e => setLabId(e.target.value)} className={inputClass}>
              {LABS.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('block text-[11px] font-medium mb-1', dark ? 'text-slate-400' : 'text-slate-600')}>
              PC Number <span className={cn('font-normal', dark ? 'text-slate-600' : 'text-slate-400')}>(1–60)</span>
            </label>
            <input
              type="number" min={1} max={60}
              value={num}
              onChange={e => setNum(e.target.value)}
              placeholder="e.g. 15"
              className={cn(inputClass, 'font-mono')}
            />
          </div>

          <p className={cn('text-[10px]', dark ? 'text-slate-600' : 'text-slate-400')}>
            The PC will be created as <strong>available / good</strong> with auto-generated credentials. You can edit it after adding.
          </p>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className={cn('flex-1 px-4 py-2 rounded-lg border text-[12px] transition-colors',
                dark ? 'border-dark-border text-slate-400 hover:bg-dark-surfaceAlt' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
              Cancel
            </button>
            <button type="submit" disabled={addPC.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium transition-colors disabled:opacity-50">
              <Plus size={13} />
              {addPC.isPending ? 'Adding…' : 'Add PC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
