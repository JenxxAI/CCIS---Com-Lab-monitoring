import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { Navigate } from 'react-router-dom'
import { useLabStore, useThemeStore, useAuthStore } from '@/store'
import { toast } from '@/store/toast'
import { LABS } from '@/lib/data'
import { COND_HEX, COND_META, downloadCSV } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Download, Printer } from 'lucide-react'

// ─── Condition trend helpers ─────────────────────────────────────────────────
// Generates 6-month simulated condition trend for the chart.
function buildConditionTrend(allPCs: any[]) {
  const months: Array<{ month: string; good: number; lagging: number; needs_repair: number; damaged: number }> = []
  const now = new Date()
  const curr = {
    good:         allPCs.filter((p: any) => p.condition === 'good').length,
    lagging:      allPCs.filter((p: any) => p.condition === 'lagging').length,
    needs_repair: allPCs.filter((p: any) => p.condition === 'needs_repair').length,
    damaged:      allPCs.filter((p: any) => p.condition === 'damaged').length,
  }
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString('default', { month: 'short' })
    const factor = 1 + (i * 0.018)
    months.push({
      month: label,
      good:         Math.round(curr.good / factor),
      lagging:      Math.round(curr.lagging * (1 + i * 0.04)),
      needs_repair: Math.round(curr.needs_repair * (1 + i * 0.035)),
      damaged:      Math.max(0, Math.round(curr.damaged * (1 + i * 0.03))),
    })
  }
  return months
}

export function AnalyticsView() {
  const { dark } = useThemeStore()
  const isStudent = useAuthStore(s => s.user?.role === 'student')
  const { labData, setActiveLab } = useLabStore()

  if (isStudent) return <Navigate to="/" replace />

  const allPCs = Object.values(labData).flat()
  const trendData = buildConditionTrend(allPCs)

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
      availablePct: ps.length > 0 ? Math.round(available / ps.length * 100) : 0 }
  }

  // ── Export handlers ────────────────────────────────────────────────────────

  const exportLabSummaryCSV = () => {
    const headers = ['Lab', 'Total PCs', 'Available', 'Occupied', 'Maintenance', 'Available %']
    const rows = LABS.map(l => {
      const s = labStats(l.id)
      return [l.name, String(s.total), String(s.available), String(s.occupied), String(s.maintenance), `${s.availablePct}%`]
    })
    rows.push(['— Total —', String(g.total), String(g.available), String(g.occupied), String(g.maintenance), `${g.total > 0 ? Math.round(g.available / g.total * 100) : 0}%`])
    downloadCSV(`lab-summary-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('Lab summary exported')
  }

  const exportAllPCsCSV = () => {
    const headers = ['Lab', 'PC #', 'Status', 'Condition', 'CPU', 'RAM', 'Storage', 'OS', 'Last Student', 'Last Used', 'Repairs']
    const rows = allPCs.map(p => {
      const lab = LABS.find(l => l.id === p.labId)
      return [
        lab?.name ?? p.labId, String(p.num), p.status, p.condition,
        p.specs.cpu, p.specs.ram, p.specs.storage, p.specs.os,
        p.lastStudent, p.lastUsed, String(p.repairs.length),
      ]
    })
    downloadCSV(`all-pcs-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows)
    toast.success('All PCs data exported')
  }

  const handlePrint = () => {
    window.print()
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
      <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className={cn('text-xl font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
            Analytics
          </h1>
          <p className={cn('text-[12px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
            System-wide overview — {LABS.length} laboratories
          </p>
        </div>

        {/* Export / Print buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={exportLabSummaryCSV}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
              dark ? 'bg-dark-surfaceAlt border border-dark-border text-slate-400 hover:text-emerald-400'
                   : 'bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 shadow-sm',
            )}
          >
            <Download size={12} />
            Lab Summary CSV
          </button>
          <button
            onClick={exportAllPCsCSV}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
              dark ? 'bg-dark-surfaceAlt border border-dark-border text-slate-400 hover:text-emerald-400'
                   : 'bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 shadow-sm',
            )}
          >
            <Download size={12} />
            All PCs CSV
          </button>
          <button
            onClick={handlePrint}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
              dark ? 'bg-dark-surfaceAlt border border-dark-border text-slate-400 hover:text-[#5b7fff]'
                   : 'bg-white border border-slate-200 text-slate-500 hover:text-blue-600 shadow-sm',
            )}
          >
            <Printer size={12} />
            Print
          </button>
        </div>
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

      {/* Condition Trend — last 6 months */}
      <div className={cn(card, 'mt-3 sm:mt-4')}>
        <div className="flex items-center gap-2 mb-4">
          <span className={cn('text-[13px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
            Condition Trend · Last 6 Months
          </span>
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded border',
            dark ? 'text-slate-400 border-slate-600 bg-slate-800' : 'text-slate-500 border-slate-300 bg-slate-100',
          )}>
            Estimated
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <XAxis dataKey="month" tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, fontSize: 11, color: textMain }}
              cursor={{ stroke: dark ? '#2a3450' : '#e2e7f0' }}
            />
            <Line type="monotone" dataKey="good"         stroke="#22c55e" strokeWidth={2} dot={false} name="Good" />
            <Line type="monotone" dataKey="lagging"      stroke="#f59e0b" strokeWidth={2} dot={false} name="Lagging" />
            <Line type="monotone" dataKey="needs_repair" stroke="#f97316" strokeWidth={2} dot={false} name="Needs Repair" />
            <Line type="monotone" dataKey="damaged"      stroke="#f43f5e" strokeWidth={2} dot={false} name="Damaged" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2">
          {[['good','#22c55e','Good'], ['lagging','#f59e0b','Lagging'], ['needs_repair','#f97316','Needs Repair'], ['damaged','#f43f5e','Damaged']].map(([,color,label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
              <span className={cn('text-[10px]', dark ? 'text-slate-500' : 'text-slate-400')}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
