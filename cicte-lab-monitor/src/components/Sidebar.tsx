import { useLabStore, useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { cn } from '@/lib/utils'

export function Sidebar() {
  const { activeLab, setActiveLab, labData } = useLabStore()
  const { dark } = useThemeStore()

  const labStats = (id: string) => {
    const ps = labData[id] ?? []
    return {
      total:       ps.length,
      available:   ps.filter(p => p.status === 'available').length,
      occupied:    ps.filter(p => p.status === 'occupied').length,
      maintenance: ps.filter(p => p.status === 'maintenance').length,
    }
  }

  return (
    <aside className={cn(
      'w-52 md:w-52 flex flex-col flex-shrink-0 overflow-y-auto h-full',
      'border-r',
      dark
        ? 'bg-dark-surface border-dark-border'
        : 'bg-white border-slate-200'
    )}>
      {/* Lab list */}
      <div className="p-3 pt-4">
        <div className={cn(
          'text-[10px] font-semibold tracking-widest uppercase pl-1 mb-2.5',
          dark ? 'text-slate-600' : 'text-slate-400'
        )}>
          Laboratories
        </div>

        {LABS.map(lab => {
          const s = labStats(lab.id)
          const isActive = activeLab === lab.id
          const pct = Math.round(s.available / s.total * 100)
          const barColor =
            pct > 60 ? '#22c55e' :
            pct > 30 ? '#f59e0b' : '#f43f5e'

          return (
            <button
              key={lab.id}
              onClick={() => setActiveLab(lab.id)}
              className={cn(
                'w-full text-left px-2.5 py-2 rounded-xl mb-0.5',
                'transition-all duration-150',
                'hover:bg-slate-100 dark:hover:bg-dark-surfaceAlt',
                isActive
                  ? dark
                    ? 'bg-dark-surfaceAlt border border-accent/30 text-accent'
                    : 'bg-blue-50 border border-blue-200 text-blue-600'
                  : 'border border-transparent text-slate-500 dark:text-slate-500'
              )}
              style={isActive ? {
                background: dark ? 'rgba(91,127,255,0.08)' : 'rgba(58,92,245,0.06)',
                borderColor: dark ? 'rgba(91,127,255,0.25)' : 'rgba(58,92,245,0.2)',
                color: dark ? '#5b7fff' : '#3a5cf5',
              } : {}}
            >
              {/* Name row */}
              <div className="flex justify-between items-center mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className={cn('text-[12px]', isActive ? 'font-600' : 'font-400')}
                    style={{ fontWeight: isActive ? 600 : 400 }}>
                    {lab.short}
                  </span>
                  {lab.hasFloorPlan && (
                    <span className={cn(
                      'text-[8px] rounded px-1 py-0.5',
                      dark
                        ? 'bg-accent/20 text-accent'
                        : 'bg-blue-100 text-blue-500'
                    )}
                      style={{ fontSize: 8 }}>
                      mapped
                    </span>
                  )}
                </div>
                <span className={cn('text-[10px]', dark ? 'text-slate-600' : 'text-slate-400')}>
                  {s.total}
                </span>
              </div>

              {/* Full name */}
              <div className={cn('text-[10px] mb-1.5', dark ? 'text-slate-600' : 'text-slate-400')}>
                {lab.name}
              </div>

              {/* Availability bar */}
              <div className={cn(
                'h-[3px] rounded-full overflow-hidden mb-1.5',
                dark ? 'bg-dark-border' : 'bg-slate-100'
              )}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>

              {/* Mini stat row */}
              <div className="flex gap-2 text-[10px]">
                <span style={{ color: '#22c55e' }}>{s.available}</span>
                <span className={dark ? 'text-slate-700' : 'text-slate-300'}>·</span>
                <span style={{ color: '#f59e0b' }}>{s.occupied}</span>
                <span className={dark ? 'text-slate-700' : 'text-slate-300'}>·</span>
                <span style={{ color: '#f43f5e' }}>{s.maintenance}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className={cn(
        'mt-auto p-3.5 border-t',
        dark ? 'border-dark-border' : 'border-slate-100'
      )}>
        <div className={cn(
          'text-[10px] font-semibold tracking-widest uppercase mb-2.5',
          dark ? 'text-slate-600' : 'text-slate-400'
        )}>
          Legend
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: 'Available',    color: '#22c55e' },
            { label: 'Occupied',     color: '#f59e0b' },
            { label: 'Maintenance',  color: '#f43f5e' },
            { label: 'Good',         color: '#22c55e' },
            { label: 'Lagging',      color: '#f59e0b' },
            { label: 'Needs Repair', color: '#f97316' },
            { label: 'Damaged',      color: '#f43f5e' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className={cn('text-[10px]', dark ? 'text-slate-500' : 'text-slate-500')}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
