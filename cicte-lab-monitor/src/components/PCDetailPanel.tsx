import { X } from 'lucide-react'
import { Badge } from './Badge'
import { STATUS_HEX, STATUS_BG_HEX, COND_HEX } from '@/lib/utils'
import { STATUS_META, COND_META } from '@/lib/utils'
import { useLabStore } from '@/store'
import { useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { cn } from '@/lib/utils'

function KV({ label, value, mono = false, t: _t }: {
  label: string; value: string; mono?: boolean; t: ReturnType<typeof useThemeStore>
}) {
  return (
    <div className={cn(
      'flex justify-between items-center py-1.5',
      'border-b border-dark-borderSub dark:border-dark-borderSub border-slate-100'
    )}>
      <span className="text-[11px] text-slate-400 dark:text-slate-500">{label}</span>
      <span className={cn(
        'text-[11px]',
        mono ? 'font-mono font-medium text-slate-200 dark:text-slate-200' : 'text-slate-300 dark:text-slate-300'
      )}
        style={{ color: mono ? undefined : undefined }}>
        {value}
      </span>
    </div>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-600 mt-5 mb-2">
      {title}
    </div>
  )
}

export function PCDetailPanel() {
  const { selectedPC, setSelectedPC, activeLab } = useLabStore()
  const { dark } = useThemeStore()
  const lab = LABS.find(l => l.id === activeLab)

  if (!selectedPC) return null

  const sc = STATUS_META[selectedPC.status]
  const cc = COND_META[selectedPC.condition]

  return (
    <aside
      className={cn(
        'w-72 flex-shrink-0 overflow-y-auto animate-fade-in',
        'border-l',
        dark
          ? 'bg-dark-surface border-dark-border'
          : 'bg-white border-slate-200'
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className={cn(
              'font-mono text-[22px] font-bold leading-tight',
              dark ? 'text-slate-100' : 'text-slate-900'
            )}>
              PC-{String(selectedPC.num).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{lab?.name}</div>
          </div>
          <button
            onClick={() => setSelectedPC(null)}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              'text-slate-500 hover:text-slate-300 transition-colors',
              dark ? 'bg-dark-surfaceAlt hover:bg-dark-border' : 'bg-slate-100 hover:bg-slate-200'
            )}
          >
            <X size={13} />
          </button>
        </div>

        {/* Status + Condition badges */}
        <div className="flex gap-2 flex-wrap mb-1">
          <Badge
            color={STATUS_HEX[selectedPC.status]}
            bg={STATUS_BG_HEX[selectedPC.status]}
          >
            {sc.label}
          </Badge>
          <Badge
            color={COND_HEX[selectedPC.condition]}
            bg={COND_HEX[selectedPC.condition] + '18'}
          >
            {cc.label}
          </Badge>
        </div>

        <div className={cn(
          'h-px my-4',
          dark ? 'bg-dark-border' : 'bg-slate-100'
        )} />

        {/* Hardware */}
        <SectionHead title="Hardware" />
        <KV label="RAM"     value={selectedPC.specs.ram}     t={useThemeStore()} />
        <KV label="Storage" value={selectedPC.specs.storage} t={useThemeStore()} />
        <KV label="OS"      value={selectedPC.specs.os}      t={useThemeStore()} />

        {/* Credentials */}
        <SectionHead title="Credentials" />
        <KV label="Password"   value={selectedPC.password}              mono t={useThemeStore()} />
        <KV label="Changed by" value={selectedPC.lastPasswordChangedBy} t={useThemeStore()} />
        <KV label="Date"       value={selectedPC.lastPasswordChange}    t={useThemeStore()} />

        {/* Network */}
        <SectionHead title="Network" />
        <KV label="SSID"       value={selectedPC.routerSSID}     t={useThemeStore()} />
        <KV label="Router key" value={selectedPC.routerPassword} mono t={useThemeStore()} />

        {/* Last Session */}
        <SectionHead title="Last Session" />
        <KV label="Student" value={selectedPC.lastStudent} t={useThemeStore()} />
        <KV label="Time"    value={selectedPC.lastUsed}    t={useThemeStore()} />

        {/* Repairs */}
        <SectionHead title={`Repair History · ${selectedPC.repairs.length}`} />
        {selectedPC.repairs.length === 0 ? (
          <p className="text-[12px] text-slate-500 italic">No repairs logged.</p>
        ) : (
          selectedPC.repairs.slice().reverse().map((r) => (
            <div
              key={r.id}
              className={cn(
                'px-3 py-2.5 rounded-lg mb-1.5',
                dark
                  ? 'bg-dark-surfaceAlt border border-dark-border'
                  : 'bg-slate-50 border border-slate-100'
              )}
            >
              <div className={cn(
                'text-[12px] font-semibold',
                dark ? 'text-slate-200' : 'text-slate-800'
              )}>{r.type}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{r.date} · {r.by}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
