import { useState } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, ShieldAlert, Clock } from 'lucide-react'
import { useAlertStore, ALERT_CONDITION_META } from '@/store/alerts'
import { useThemeStore, useAuthStore } from '@/store'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast'
import { LABS } from '@/lib/data'
import type { AlertCondition } from '@/types'

// ─── Alert Rules Manager (embedded in Notification Center) ───────────────────

export function AlertRulesManager() {
  const { dark } = useThemeStore()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const { rules, addRule, removeRule, toggleRule } = useAlertStore()
  const [showForm, setShowForm] = useState(false)

  // New rule form
  const [name, setName]           = useState('')
  const [condition, setCondition] = useState<AlertCondition>('pc-offline')
  const [threshold, setThreshold] = useState(10)
  const [lab, setLab]             = useState<string>('')

  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const inputCls = cn(
    'rounded-lg border px-3 py-1.5 text-[12px] outline-none transition-colors w-full',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
      : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addRule({
      name: name.trim(),
      condition,
      thresholdMin: threshold,
      labId: lab || undefined,
      enabled: true,
    })
    toast.success('Alert rule created')
    setName('')
    setCondition('pc-offline')
    setThreshold(10)
    setLab('')
    setShowForm(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ShieldAlert size={13} style={{ color: accent }} />
          <span className={cn('text-[12px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
            Alert Rules
          </span>
          <span className={cn('text-[10px]', dark ? 'text-slate-600' : 'text-slate-400')}>
            ({rules.filter(r => r.enabled).length} active)
          </span>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowForm(o => !o)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors',
              dark ? 'border-dark-border text-slate-400 hover:text-slate-200' : 'border-slate-200 text-slate-500 hover:text-slate-700'
            )}
          >
            <Plus size={11} />
            Add Rule
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && isAdmin && (
        <form onSubmit={handleAdd} className={cn(
          'p-3 rounded-xl border mb-3 space-y-2',
          dark ? 'bg-dark-surfaceAlt border-dark-border' : 'bg-slate-50 border-slate-100'
        )}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Rule name…"
            className={inputCls}
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={condition}
              onChange={e => {
                const c = e.target.value as AlertCondition
                setCondition(c)
                setThreshold(ALERT_CONDITION_META[c].defaultMin)
              }}
              className={cn(inputCls, 'flex-1')}
            >
              {Object.entries(ALERT_CONDITION_META).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <select
              value={lab}
              onChange={e => setLab(e.target.value)}
              className={cn(inputCls, 'w-28')}
            >
              <option value="">All Labs</option>
              {LABS.map(l => <option key={l.id} value={l.id}>{l.short}</option>)}
            </select>
          </div>

          {(condition === 'pc-offline' || condition === 'ticket-unresolved') && (
            <div className="flex items-center gap-2">
              <Clock size={12} className={dark ? 'text-slate-500' : 'text-slate-400'} />
              <span className={cn('text-[11px]', dark ? 'text-slate-400' : 'text-slate-500')}>
                Threshold:
              </span>
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={e => setThreshold(+e.target.value)}
                className={cn(inputCls, 'w-20 text-center')}
              />
              <span className={cn('text-[11px]', dark ? 'text-slate-500' : 'text-slate-400')}>min</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={cn('px-3 py-1.5 rounded-lg text-[11px] font-medium', dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              Create Rule
            </button>
          </div>
        </form>
      )}

      {/* Rules list */}
      <div className="space-y-1.5">
        {rules.length === 0 ? (
          <p className={cn('text-center py-4 text-[12px]', dark ? 'text-slate-600' : 'text-slate-400')}>
            No alert rules configured.
          </p>
        ) : rules.map(rule => {
          const meta = ALERT_CONDITION_META[rule.condition]
          return (
            <div
              key={rule.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
                rule.enabled
                  ? (dark ? 'bg-dark-surfaceAlt border-dark-border' : 'bg-white border-slate-200')
                  : (dark ? 'bg-dark-bg border-dark-border opacity-50' : 'bg-slate-50 border-slate-100 opacity-50'),
              )}
            >
              {/* Icon */}
              <span className="text-[13px] flex-shrink-0">{meta.icon}</span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className={cn('text-[11px] font-semibold truncate', dark ? 'text-slate-200' : 'text-slate-800')}>
                  {rule.name}
                </div>
                <div className={cn('text-[10px] flex items-center gap-1', dark ? 'text-slate-500' : 'text-slate-400')}>
                  <span style={{ color: meta.color }}>{meta.label}</span>
                  {rule.thresholdMin > 0 && <span>· {rule.thresholdMin}min</span>}
                  {rule.labId && <span>· {rule.labId.toUpperCase()}</span>}
                </div>
              </div>

              {/* Toggle */}
              {isAdmin && (
                <button
                  onClick={() => {
                    toggleRule(rule.id)
                    toast.info(`Rule ${rule.enabled ? 'disabled' : 'enabled'}`)
                  }}
                  className="flex-shrink-0 transition-colors"
                  title={rule.enabled ? 'Disable' : 'Enable'}
                >
                  {rule.enabled
                    ? <ToggleRight size={18} style={{ color: accent }} />
                    : <ToggleLeft size={18} className={dark ? 'text-slate-600' : 'text-slate-400'} />
                  }
                </button>
              )}

              {/* Delete */}
              {isAdmin && (
                <button
                  onClick={() => { removeRule(rule.id); toast.info('Rule removed') }}
                  className={cn('flex-shrink-0 transition-colors', dark ? 'text-slate-600 hover:text-rose-400' : 'text-slate-400 hover:text-rose-500')}
                  title="Delete rule"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
