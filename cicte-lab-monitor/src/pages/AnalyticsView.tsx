import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useLabStore, useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { COND_HEX, COND_META } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function AnalyticsView() {
  const { dark } = useThemeStore()
  const { labData, setActiveLab } = useLabStore()

  const allPCs = Object.values(labData).flat()

  const g = {
    total:       allPCs.length,
    available:   allPCs.filter(p => p.status === 'available').length,
    occupied:    allPCs.filter(p => p.status === 'occupied').length,
    maintenance: allPCs.filter(p => p.status === 'maintenance').length,
  }

  const labStats = (id: string) => {
    const ps = labData[id] ?? []
    const available   = ps.filter(p => p.status === 'available').length
    const occupied    = ps.filter(p => p.status === 'occupied').length
    const maintenance = ps.filter(p => p.status === 'maintenance').length
    return { total: ps.length, available, occupied, maintenance,
      availablePct: Math.round(available / ps.length * 100) }
  }

  // Data for bar chart
  const barData = LABS.map(l => {
    const s = labStats(l.id)
    return { name: l.short, available: s.available, occupied: s.occupied, maintenance: s.maintenance }
  })

  // Condition breakdown for pie
  const condData = Object.entries(COND_META).map(([k, v]) => ({
    name:  v.label,
    value: allPCs.filter(p => p.condition === k).length,
    color: COND_HEX[k as keyof typeof COND_HEX],
  }))

  const textMain  = dark ? '#e8ecf4' : '#0f1724'
  const textMuted = dark ? '#3e4a62' : '#aab2c8'
  const surface   = dark ? '#141824' : '#ffffff'
  const border    = dark ? '#232b3e' : '#e2e7f0'
  const card      = cn(
    'rounded-2xl border p-5',
    dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200 shadow-sm'
  )

  return (
    <div className="p-3 sm:p-6 animate-fade-in">
      <div className="mb-4 sm:mb-5">
        <h1 className={cn('text-xl font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
          Analytics
        </h1>
        <p className={cn('text-[12px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
          System-wide overview — 9 laboratories
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
        {[
          { label: 'Total PCs',    val: g.total,       color: textMain,   sub: `${LABS.length} labs`                          },
          { label: 'Available',    val: g.available,   color: '#22c55e',  sub: `${Math.round(g.available/g.total*100)}% free`  },
          { label: 'Occupied',     val: g.occupied,    color: '#f59e0b',  sub: 'In use now'                                    },
          { label: 'Maintenance',  val: g.maintenance, color: '#f43f5e',  sub: 'Need attention'                                },
        ].map((s, i) => (
          <div key={i} className={card}>
            <div className={cn('text-[11px] tracking-wide mb-2', dark ? 'text-slate-500' : 'text-slate-400')}>
              {s.label}
            </div>
            <div className="text-[30px] font-bold leading-none" style={{ color: s.color }}>
              {s.val}
            </div>
            <div className={cn('text-[11px] mt-1.5', dark ? 'text-slate-600' : 'text-slate-400')}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Per-lab bar chart + condition pie side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        {/* Bar chart — occupancy per lab */}
        <div className={cn(card, 'lg:col-span-2')}>
          <div className={cn('text-[13px] font-semibold mb-4', dark ? 'text-slate-200' : 'text-slate-800')}>
            Occupancy by Lab
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={12} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, fontSize: 11, color: textMain }}
                cursor={{ fill: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="available"   name="Available"   fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="occupied"    name="Occupied"    fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="maintenance" name="Maintenance" fill="#f43f5e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — condition breakdown */}
        <div className={card}>
          <div className={cn('text-[13px] font-semibold mb-4', dark ? 'text-slate-200' : 'text-slate-800')}>
            Condition Split
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={condData} cx="50%" cy="45%" innerRadius={44} outerRadius={72}
                paddingAngle={3} dataKey="value">
                {condData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, fontSize: 11, color: textMain }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Mini legend */}
          <div className="flex flex-col gap-1 mt-1">
            {condData.map(d => (
              <div key={d.name} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                  <span className={cn('text-[10px]', dark ? 'text-slate-500' : 'text-slate-500')}>{d.name}</span>
                </div>
                <span className={cn('text-[10px] font-mono', dark ? 'text-slate-400' : 'text-slate-500')}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-lab cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4">
        {LABS.map(l => {
          const s   = labStats(l.id)
          const bc  = s.availablePct > 60 ? '#22c55e' : s.availablePct > 30 ? '#f59e0b' : '#f43f5e'
          return (
            <div
              key={l.id}
              onClick={() => setActiveLab(l.id)}
              className={cn(
                card, 'cursor-pointer transition-all duration-150',
                'hover:border-slate-400 dark:hover:border-slate-500'
              )}
            >
              <div className="flex justify-between items-start mb-2.5">
                <div>
                  <div className={cn('flex items-center gap-2')}>
                    <span className={cn('text-[13px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
                      {l.name}
                    </span>
                    {l.hasFloorPlan && (
                      <span className={cn('text-[8px] rounded px-1 py-0.5',
                        dark ? 'bg-accent/20 text-accent' : 'bg-blue-100 text-blue-500'
                      )} style={{ fontSize: 8 }}>
                        mapped
                      </span>
                    )}
                  </div>
                  <div className={cn('text-[11px] mt-0.5', dark ? 'text-slate-600' : 'text-slate-400')}>
                    {s.total} PCs
                  </div>
                </div>
                <span className="text-[13px] font-bold" style={{ color: bc }}>
                  {s.availablePct}%
                </span>
              </div>
              <div className={cn('h-1.5 rounded-full overflow-hidden mb-2',
                dark ? 'bg-dark-border' : 'bg-slate-100')}>
                <div className="h-full rounded-full" style={{ width: `${s.availablePct}%`, background: bc }} />
              </div>
              <div className="flex gap-3 text-[11px]">
                <span style={{ color: '#22c55e' }}>{s.available} free</span>
                <span style={{ color: '#f59e0b' }}>{s.occupied} used</span>
                <span style={{ color: '#f43f5e' }}>{s.maintenance} maint.</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Condition bars */}
      <div className={card}>
        <div className={cn('text-[13px] font-semibold mb-4', dark ? 'text-slate-200' : 'text-slate-800')}>
          System-wide Condition Breakdown
        </div>
        {Object.entries(COND_META).map(([k, v]) => {
          const count = allPCs.filter(p => p.condition === k).length
          const pct   = Math.round(count / allPCs.length * 100)
          const color = COND_HEX[k as keyof typeof COND_HEX]
          return (
            <div key={k} className="mb-3.5">
              <div className="flex justify-between mb-1.5">
                <span className={cn('text-[12px] font-medium', dark ? 'text-slate-400' : 'text-slate-600')}>
                  {v.label}
                </span>
                <span className={cn('text-[11px] font-mono', dark ? 'text-slate-500' : 'text-slate-400')}>
                  {count} PCs · {pct}%
                </span>
              </div>
              <div className={cn('h-1.5 rounded-full overflow-hidden', dark ? 'bg-dark-border' : 'bg-slate-100')}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}40` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
