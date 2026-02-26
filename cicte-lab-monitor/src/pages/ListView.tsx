import { useLabStore, useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { Badge } from '@/components/Badge'
import { STATUS_HEX, STATUS_BG_HEX, COND_HEX, COND_META, STATUS_META } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'

export function ListView() {
  const { dark } = useThemeStore()
  const {
    activeLab, labData, selectedPC, setSelectedPC,
    statusFilter, setStatusFilter, searchQuery, setSearchQuery,
  } = useLabStore()

  const lab = LABS.find(l => l.id === activeLab)!
  const pcs = labData[activeLab] ?? []

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

  const headers = ['PC', 'Status', 'Condition', 'Last Student', 'Last Used', 'Changed By', 'Repairs']

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-5">
        <div>
          <h1 className={cn('text-xl font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
            {lab.name}
          </h1>
          <p className={cn('text-[12px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
            {filtered.length} of {pcs.length} workstations
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[12px]',
            dark ? 'bg-dark-surfaceAlt border-dark-border' : 'bg-white border-slate-200'
          )}>
            <Search size={13} className={dark ? 'text-slate-500' : 'text-slate-400'} />
            <input
              type="text"
              placeholder="Search student, staff…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                'bg-transparent outline-none w-44 placeholder:text-slate-500',
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
        </div>
      </div>

      {/* Table */}
      <div className={cn(
        'rounded-2xl border overflow-hidden',
        dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200 shadow-sm'
      )}>
        <table className="w-full border-collapse">
          <thead>
            <tr className={cn(dark ? 'bg-dark-surfaceAlt' : 'bg-slate-50')}>
              {headers.map(h => (
                <th key={h} className={cn(
                  'px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase border-b',
                  dark ? 'text-slate-600 border-dark-border' : 'text-slate-400 border-slate-200'
                )}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(pc => {
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
    </div>
  )
}
