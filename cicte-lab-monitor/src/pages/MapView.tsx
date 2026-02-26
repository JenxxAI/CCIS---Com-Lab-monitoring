import { useLabStore, useThemeStore, useLayoutStore } from '@/store'
import { LABS } from '@/lib/data'
import { DragDropFloorPlan } from '@/components/DragDropFloorPlan'
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
  const { editMode, setEditMode, resetLayout } = useLayoutStore()

  const lab  = LABS.find(l => l.id === activeLab)!
  const pcs  = labData[activeLab] ?? []
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const statusOptions: Array<{ value: string; label: string; color?: string; bg?: string }> = [
    { value: 'all',         label: 'All' },
    { value: 'available',   label: 'Available',   color: '#22c55e', bg: 'rgba(34,197,94,0.10)'  },
    { value: 'occupied',    label: 'Occupied',    color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
    { value: 'maintenance', label: 'Maintenance', color: '#f43f5e', bg: 'rgba(244,63,94,0.10)'  },
  ]

  return (
    <div className="p-3 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-4 sm:mb-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div>
            <h1 className={cn('text-xl font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
              {lab.name}
            </h1>
            <p className={cn('text-[12px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
              {pcs.length} workstations
            </p>
          </div>

          {/* Edit Layout toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150',
              editMode
                ? 'text-white shadow-md'
                : (dark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'),
            )}
            style={{
              background: editMode
                ? accent
                : (dark ? '#1a2030' : '#f0f4ff'),
              border: `1px solid ${editMode ? accent : (dark ? '#232b3e' : '#dde3f0')}`,
            }}
          >
            {editMode ? '✓ Done Editing' : '✎ Edit Layout'}
          </button>

          {/* Reset layout */}
          {editMode && (
            <button
              onClick={() => { resetLayout(activeLab); }}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                dark ? 'bg-dark-surfaceAlt border border-dark-border text-slate-400 hover:text-red-400'
                     : 'bg-white border border-slate-200 text-slate-500 hover:text-red-500',
              )}
            >
              ↺ Reset
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
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

      {/* Floor plan — drag & drop canvas, scrollable horizontally on mobile */}
      <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
        <DragDropFloorPlan
          labId={activeLab}
          labName={lab.name}
          pcs={pcs}
          selectedPC={selectedPC}
          statusFilter={statusFilter as PCStatus | 'all'}
          onSelect={(pc) => setSelectedPC(pc)}
        />
      </div>

      {/* Condition legend */}
      <div className="flex items-center gap-3 sm:gap-4 mt-4 flex-wrap">
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
