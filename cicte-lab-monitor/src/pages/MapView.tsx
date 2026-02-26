import { useLabStore, useThemeStore } from '@/store'
import { LABS, GENERIC_GRIDS } from '@/lib/data'
import { FloorPlanCL123, FloorPlanCL45, FloorPlanGeneric } from '@/components/FloorPlans'
import { COND_HEX, COND_META } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PCStatus } from '@/types'

export function MapView() {
  const { dark } = useThemeStore()
  const {
    activeLab, labData, selectedPC,
    setSelectedPC, statusFilter, condFilter: _condFilter,
    setStatusFilter, setCondFilter: _setCondFilter,
  } = useLabStore()

  const lab  = LABS.find(l => l.id === activeLab)!
  const pcs  = labData[activeLab] ?? []
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const statusOptions: Array<{ value: string; label: string; color?: string; bg?: string }> = [
    { value: 'all',         label: 'All' },
    { value: 'available',   label: 'Available',   color: '#22c55e', bg: 'rgba(34,197,94,0.10)'  },
    { value: 'occupied',    label: 'Occupied',    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
    { value: 'maintenance', label: 'Maintenance', color: '#f43f5e', bg: 'rgba(244,63,94,0.10)'  },
  ]

  const renderFloorPlan = () => {
    const props = {
      labName: lab.name, pcs,
      selectedPC, statusFilter: statusFilter as PCStatus | 'all',
      onSelect: (pc: any) => setSelectedPC(pc),
    }
    if (['cl1','cl2','cl3'].includes(activeLab)) return <FloorPlanCL123 {...props} />
    if (['cl4','cl5'].includes(activeLab))       return <FloorPlanCL45  {...props} />
    const g = GENERIC_GRIDS[activeLab] ?? { rows: 4, cols: 6 }
    return <FloorPlanGeneric {...props} rows={g.rows} cols={g.cols} />
  }

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end mb-5">
        <div>
          <h1 className={cn('text-xl font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
            {lab.name}
          </h1>
          <p className={cn('text-[12px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
            {pcs.length} workstations
            {lab.hasFloorPlan && (
              <span className="ml-2 font-medium" style={{ color: accent }}>
                ✦ Actual floor plan
              </span>
            )}
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5">
          <span className={cn('text-[11px] mr-1', dark ? 'text-slate-600' : 'text-slate-400')}>
            Filter
          </span>
          {statusOptions.map(opt => {
            const active = statusFilter === opt.value
            return (
              <button key={opt.value}
                onClick={() => setStatusFilter(opt.value as any)}
                className="px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-150"
                style={{
                  background: active
                    ? (opt.bg ?? (dark ? 'rgba(91,127,255,0.10)' : 'rgba(58,92,245,0.07)'))
                    : (dark ? '#1a2030' : '#f5f8ff'),
                  color: active
                    ? (opt.color ?? accent)
                    : (dark ? '#5a6a85' : '#8a96b0'),
                  border: `1px solid ${active
                    ? (opt.color ? opt.color + '55' : accent + '55')
                    : (dark ? '#232b3e' : '#dde3f0')}`,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Floor plan */}
      <div className="overflow-x-auto pb-2">
        {renderFloorPlan()}
      </div>

      {/* Condition legend */}
      <div className="flex items-center gap-4 mt-4">
        <span className={cn('text-[11px]', dark ? 'text-slate-600' : 'text-slate-400')}>
          Condition:
        </span>
        {Object.entries(COND_META).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: COND_HEX[k as keyof typeof COND_HEX], boxShadow: `0 0 4px ${COND_HEX[k as keyof typeof COND_HEX]}70` }}
            />
            <span className={cn('text-[11px]', dark ? 'text-slate-500' : 'text-slate-500')}>
              {v.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
