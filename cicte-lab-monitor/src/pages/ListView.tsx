import { useState, useEffect, useRef } from 'react'
import { useLabStore, useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { Badge } from '@/components/Badge'
import { STATUS_HEX, STATUS_BG_HEX, COND_HEX, COND_META, STATUS_META, cn, downloadCSV } from '@/lib/utils'
import { Search, ChevronUp, ChevronDown, Download } from 'lucide-react'
import type { PC } from '@/types'
import { BatchActionsBar } from '@/components/BatchActionsBar'

type SortKey = 'num' | 'status' | 'condition' | 'lastStudent' | 'lastUsed' | 'lastPasswordChangedBy' | 'repairs'
type SortDir = 'asc' | 'desc'

function comparePCs(a: PC, b: PC, key: SortKey, dir: SortDir): number {
  let cmp = 0
  switch (key) {
    case 'num':                    cmp = a.num - b.num; break
    case 'status':                 cmp = a.status.localeCompare(b.status); break
    case 'condition':              cmp = a.condition.localeCompare(b.condition); break
    case 'lastStudent':            cmp = a.lastStudent.localeCompare(b.lastStudent); break
    case 'lastUsed':               cmp = a.lastUsed.localeCompare(b.lastUsed); break
    case 'lastPasswordChangedBy':  cmp = a.lastPasswordChangedBy.localeCompare(b.lastPasswordChangedBy); break
    case 'repairs':                cmp = a.repairs.length - b.repairs.length; break
  }
  return dir === 'asc' ? cmp : -cmp
}

export function ListView() {
  const { dark } = useThemeStore()
  const {
    activeLab, labData, selectedPC, setSelectedPC,
    statusFilter, setStatusFilter, searchQuery, setSearchQuery,
  } = useLabStore()

  const lab = LABS.find(l => l.id === activeLab)!
  const pcs = labData[activeLab] ?? []

  // Focus search when Ctrl+/ shortcut fires
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const handler = () => searchRef.current?.focus()
    window.addEventListener('cicte:focus-search', handler)
    return () => window.removeEventListener('cicte:focus-search', handler)
  }, [])

  const filtered = pcs.filter(pc => {
    if (statusFilter !== 'all' && pc.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!pc.lastStudent.toLowerCase().includes(q) &&
          !pc.lastPasswordChangedBy.toLowerCase().includes(q) &&
          !String(pc.num).includes(q)) return false
    }
    return true
  })

  // Sortable columns
  const [sortKey, setSortKey] = useState<SortKey>('num')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...filtered].sort((a, b) => comparePCs(a, b, sortKey, sortDir))

  const columns: { label: string; key: SortKey }[] = [
    { label: 'PC',         key: 'num' },
    { label: 'Status',     key: 'status' },
    { label: 'Condition',  key: 'condition' },
    { label: 'Last Student', key: 'lastStudent' },
    { label: 'Last Used',    key: 'lastUsed' },
    { label: 'Changed By',   key: 'lastPasswordChangedBy' },
    { label: 'Repairs',      key: 'repairs' },
  ]

  return (
    <div className="p-3 sm:p-6 animate-fade-in relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-4 sm:mb-5">
        <div>
          <h1 className={cn('text-xl font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
            {lab.name}
          </h1>
          <p className={cn('text-[12px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
            {filtered.length} of {pcs.length} workstations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px]',
            dark ? 'bg-dark-surfaceAlt border-dark-border' : 'bg-white border-slate-200'
          )}>
            <Search size={13} className={dark ? 'text-slate-500' : 'text-slate-400'} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search student, staff… (Ctrl+/)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                'bg-transparent outline-none w-32 sm:w-44 placeholder:text-slate-500',
                dark ? 'text-slate-200' : 'text-slate-800'
              )}
            />
          </div>

          {/* Filter */}
          {(['all', 'available', 'occupied', 'maintenance'] as const).map(s => {
            const active = statusFilter === s
            const color  = s === 'all' ? (dark ? '#5b7fff' : '#3a5cf5') : STATUS_HEX[s]
            const bg     = s === 'all'
              ? (dark ? 'rgba(91,127,255,0.10)' : 'rgba(58,92,245,0.07)')
              : STATUS_BG_HEX[s]
            return (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-150"
                style={{
                  background: active ? bg : (dark ? '#1a2030' : '#f5f8ff'),
                  color:      active ? color : (dark ? '#5a6a85' : '#8a96b0'),
                  border:     `1px solid ${active ? color + '55' : (dark ? '#232b3e' : '#dde3f0')}`,
                }}
              >
                {s === 'all' ? 'All' : STATUS_META[s].label}
              </button>
            )
          })}

          {/* Export CSV */}
          <button
            onClick={() => downloadCSV(
              `${lab.name.replace(/\s+/g, '-')}-pcs.csv`,
              ['PC', 'Status', 'Condition', 'Last Student', 'Last Used', 'Changed By', 'Repairs'],
              sorted.map(pc => [
                `PC-${pc.num}`,
                STATUS_META[pc.status].label,
                COND_META[pc.condition].label,
                pc.lastStudent,
                pc.lastUsed,
                pc.lastPasswordChangedBy,
                String(pc.repairs.length),
              ])
            )}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-colors',
              dark
                ? 'bg-dark-surfaceAlt border-dark-border text-slate-400 hover:text-slate-200'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700'
            )}
            title="Export visible rows as CSV"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      {/* Table — Desktop */}
      <div className={cn(
        'rounded-2xl border overflow-hidden hidden sm:block',
        dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200 shadow-sm'
      )}>
        <table className="w-full border-collapse">
          <thead>
            <tr className={cn(dark ? 'bg-dark-surfaceAlt' : 'bg-slate-50')}>
              {columns.map(col => {
                const isActive = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase border-b cursor-pointer select-none transition-colors',
                      dark ? 'border-dark-border hover:text-slate-400' : 'border-slate-200 hover:text-slate-600',
                      isActive ? (dark ? 'text-slate-300' : 'text-slate-700') : (dark ? 'text-slate-600' : 'text-slate-400'),
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {isActive && (sortDir === 'asc'
                        ? <ChevronUp size={12} className="opacity-70" />
                        : <ChevronDown size={12} className="opacity-70" />
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map(pc => {
              const isSel = selectedPC?.id === pc.id
              const cc    = COND_META[pc.condition]
              return (
                <tr
                  key={pc.id}
                  onClick={() => setSelectedPC(pc)}
                  className={cn(
                    'border-b cursor-pointer transition-colors duration-100',
                    dark ? 'border-dark-borderSub' : 'border-slate-50',
                    isSel
                      ? (dark ? 'bg-[rgba(91,127,255,0.08)]' : 'bg-blue-50')
                      : (dark ? 'hover:bg-dark-surfaceAlt' : 'hover:bg-slate-50')
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'font-mono text-[12px] font-semibold',
                      dark ? 'text-slate-200' : 'text-slate-800'
                    )}>
                      PC-{String(pc.num).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge color={STATUS_HEX[pc.status]} bg={STATUS_BG_HEX[pc.status]}>
                      {STATUS_META[pc.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[12px] font-medium" style={{ color: COND_HEX[pc.condition] }}>
                      {cc.label}
                    </span>
                  </td>
                  <td className={cn('px-4 py-2.5 text-[12px]', dark ? 'text-slate-400' : 'text-slate-600')}>
                    {pc.lastStudent}
                  </td>
                  <td className={cn('px-4 py-2.5 text-[11px] font-mono', dark ? 'text-slate-500' : 'text-slate-400')}>
                    {pc.lastUsed}
                  </td>
                  <td className={cn('px-4 py-2.5 text-[12px]', dark ? 'text-slate-400' : 'text-slate-600')}>
                    {pc.lastPasswordChangedBy}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'text-[12px] font-semibold',
                      pc.repairs.length > 3 ? 'text-orange-500' : (dark ? 'text-slate-500' : 'text-slate-400')
                    )}>
                      {pc.repairs.length}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className={cn(
            'py-12 text-center text-[13px]',
            dark ? 'text-slate-600' : 'text-slate-400'
          )}>
            No PCs match the current filters.
          </div>
        )}
      </div>

      {/* Mobile card layout */}
      <div className="sm:hidden flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className={cn(
            'py-12 text-center text-[13px]',
            dark ? 'text-slate-600' : 'text-slate-400'
          )}>
            No PCs match the current filters.
          </div>
        )}
        {sorted.map(pc => {
          const isSel = selectedPC?.id === pc.id
          const cc    = COND_META[pc.condition]
          return (
            <div
              key={pc.id}
              onClick={() => setSelectedPC(pc)}
              className={cn(
                'rounded-xl border p-3 cursor-pointer transition-colors',
                dark ? 'border-dark-border' : 'border-slate-200',
                isSel
                  ? (dark ? 'bg-[rgba(91,127,255,0.08)] border-accent/30' : 'bg-blue-50 border-blue-200')
                  : (dark ? 'bg-dark-surface' : 'bg-white')
              )}
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className={cn('font-mono text-[13px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
                  PC-{String(pc.num).padStart(2, '0')}
                </span>
                <div className="flex gap-1.5">
                  <Badge color={STATUS_HEX[pc.status]} bg={STATUS_BG_HEX[pc.status]}>
                    {STATUS_META[pc.status].label}
                  </Badge>
                  <span className="text-[11px] font-medium" style={{ color: COND_HEX[pc.condition] }}>
                    {cc.label}
                  </span>
                </div>
              </div>
              <div className={cn('text-[11px] flex flex-wrap gap-x-3 gap-y-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
                <span>{pc.lastStudent}</span>
                <span className="font-mono">{pc.lastUsed}</span>
                <span>{pc.repairs.length} repairs</span>
              </div>
            </div>
          )
        })}
      </div>
      {/* Batch actions bar (admin only) */}
      <BatchActionsBar />
    </div>
  )
}
