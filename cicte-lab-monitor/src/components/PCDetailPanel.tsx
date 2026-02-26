import { X, Monitor, Cpu, Wifi, Shield, Clock, Wrench, Package } from 'lucide-react'
import { Badge } from './Badge'
import { STATUS_HEX, STATUS_BG_HEX, COND_HEX } from '@/lib/utils'
import { STATUS_META, COND_META } from '@/lib/utils'
import { useLabStore } from '@/store'
import { useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { cn } from '@/lib/utils'

function KV({ label, value, mono = false }: {
  label: string; value: string; mono?: boolean
}) {
  const { dark } = useThemeStore()
  return (
    <div className={cn(
      'flex justify-between items-center py-1.5 gap-2',
      'border-b',
      dark ? 'border-dark-borderSub' : 'border-slate-100'
    )}>
      <span className={cn('text-[11px] flex-shrink-0', dark ? 'text-slate-500' : 'text-slate-400')}>{label}</span>
      <span className={cn(
        'text-[11px] text-right',
        mono
          ? (dark ? 'font-mono font-medium text-slate-200' : 'font-mono font-medium text-slate-700')
          : (dark ? 'text-slate-300' : 'text-slate-600')
      )}>
        {value}
      </span>
    </div>
  )
}

function SectionHead({ title, icon }: { title: string; icon?: React.ReactNode }) {
  const { dark } = useThemeStore()
  return (
    <div className={cn(
      'flex items-center gap-1.5 mt-5 mb-2',
      dark ? 'text-slate-500' : 'text-slate-400'
    )}>
      {icon}
      <span className="text-[10px] font-semibold tracking-widest uppercase">{title}</span>
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
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  return (
    <aside
      className={cn(
        'w-full md:w-80 flex-shrink-0 overflow-y-auto animate-fade-in',
        'border-l md:border-l',
        dark
          ? 'bg-dark-surface border-dark-border'
          : 'bg-white border-slate-200'
      )}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className={cn(
              'font-mono text-[22px] font-bold leading-tight',
              dark ? 'text-slate-100' : 'text-slate-900'
            )}>
              PC-{String(selectedPC.num).padStart(2, '0')}
            </div>
            <div className={cn('text-[11px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
              {lab?.name} &middot; {selectedPC.specs.pcType}
            </div>
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
          <Badge color={STATUS_HEX[selectedPC.status]} bg={STATUS_BG_HEX[selectedPC.status]}>
            {sc.label}
          </Badge>
          <Badge color={COND_HEX[selectedPC.condition]} bg={COND_HEX[selectedPC.condition] + '18'}>
            {cc.label}
          </Badge>
        </div>

        <div className={cn('h-px my-4', dark ? 'bg-dark-border' : 'bg-slate-100')} />

        {/* System Information */}
        <SectionHead title="System" icon={<Monitor size={11} />} />
        <KV label="Type" value={selectedPC.specs.pcType} />
        <KV label="OS" value={selectedPC.specs.os} />
        {selectedPC.specs.osBuild && (
          <KV label="Build" value={selectedPC.specs.osBuild} mono />
        )}

        {/* Hardware */}
        <SectionHead title="Hardware" icon={<Cpu size={11} />} />
        <KV label="CPU" value={selectedPC.specs.cpu} />
        {selectedPC.specs.gpu && (
          <KV label="GPU" value={selectedPC.specs.gpu} />
        )}
        <KV label="RAM" value={selectedPC.specs.ram} />
        <KV label="Storage" value={selectedPC.specs.storage} />
        {selectedPC.specs.motherboard && (
          <KV label="Motherboard" value={selectedPC.specs.motherboard} />
        )}
        {selectedPC.specs.monitor && (
          <KV label="Monitor" value={selectedPC.specs.monitor} />
        )}

        {/* Network */}
        <SectionHead title="Network" icon={<Wifi size={11} />} />
        {selectedPC.specs.ipAddress && (
          <KV label="IP Address" value={selectedPC.specs.ipAddress} mono />
        )}
        {selectedPC.specs.macAddress && (
          <KV label="MAC Address" value={selectedPC.specs.macAddress} mono />
        )}
        <KV label="SSID" value={selectedPC.routerSSID} />
        <KV label="Router Key" value={selectedPC.routerPassword} mono />

        {/* Installed Software */}
        <SectionHead title={`Software \u00b7 ${selectedPC.specs.software.length}`} icon={<Package size={11} />} />
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedPC.specs.software.map((sw) => (
            <span
              key={sw}
              className={cn(
                'inline-block px-2 py-0.5 rounded-md text-[10px] font-medium',
                dark
                  ? 'bg-dark-surfaceAlt border border-dark-border text-slate-400'
                  : 'bg-slate-50 border border-slate-200 text-slate-500'
              )}
            >
              {sw}
            </span>
          ))}
        </div>

        {/* Credentials */}
        <SectionHead title="Credentials" icon={<Shield size={11} />} />
        <KV label="Password" value={selectedPC.password} mono />
        <KV label="Changed by" value={selectedPC.lastPasswordChangedBy} />
        <KV label="Date" value={selectedPC.lastPasswordChange} />

        {/* Last Session */}
        <SectionHead title="Last Session" icon={<Clock size={11} />} />
        <KV label="Student" value={selectedPC.lastStudent} />
        <KV label="Time" value={selectedPC.lastUsed} />

        {/* Repair History */}
        <SectionHead title={`Repairs \u00b7 ${selectedPC.repairs.length}`} icon={<Wrench size={11} />} />
        {selectedPC.repairs.length === 0 ? (
          <p className={cn('text-[12px] italic', dark ? 'text-slate-600' : 'text-slate-400')}>
            No repairs logged.
          </p>
        ) : (
          selectedPC.repairs.slice().reverse().map((r) => (
            <div
              key={r.id}
              className={cn(
                'px-3 py-2 rounded-lg mb-1.5',
                dark
                  ? 'bg-dark-surfaceAlt border border-dark-border'
                  : 'bg-slate-50 border border-slate-100'
              )}
            >
              <div className={cn(
                'text-[12px] font-semibold',
                dark ? 'text-slate-200' : 'text-slate-800'
              )}>{r.type}</div>
              <div className={cn('text-[11px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
                {r.date} &middot; {r.by}
              </div>
            </div>
          ))
        )}

        {/* Quick summary bar */}
        <div className={cn(
          'mt-5 p-3 rounded-xl text-center',
          dark ? 'bg-dark-surfaceAlt border border-dark-border' : 'bg-slate-50 border border-slate-100'
        )}>
          <div className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: accent }}>
            Quick Summary
          </div>
          <div className="flex justify-around text-[11px]">
            <div>
              <div className="font-semibold" style={{ color: STATUS_HEX[selectedPC.status] }}>{sc.label}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Status</div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: COND_HEX[selectedPC.condition] }}>{cc.label}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Condition</div>
            </div>
            <div>
              <div className={cn('font-semibold', dark ? 'text-slate-200' : 'text-slate-700')}>{selectedPC.specs.software.length}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Apps</div>
            </div>
            <div>
              <div className={cn('font-semibold', selectedPC.repairs.length > 3 ? 'text-orange-500' : (dark ? 'text-slate-200' : 'text-slate-700'))}>{selectedPC.repairs.length}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Repairs</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
