import { useState } from 'react'
import { useLabStore, useThemeStore, useLayoutStore, useAuthStore } from '@/store'
import { toast } from '@/store/toast'
import { LABS } from '@/lib/data'
import { DragDropFloorPlan } from '@/components/DragDropFloorPlan'
import { ZoomPanWrapper } from '@/components/floorplan/ZoomPanWrapper'
import { CANVAS_W, CANVAS_H } from '@/components/floorplan/constants'
import { COND_HEX, COND_META } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PCStatus, StatusFilter } from '@/types'
import { Monitor, CalendarDays } from 'lucide-react'
import { BatchActionsBar } from '@/components/BatchActionsBar'
import { LabSchedulePanel } from '@/components/LabSchedulePanel'

export function MapView() {
  const { dark } = useThemeStore()
  const {
    activeLab, labData, selectedPC, isLoading,
    setSelectedPC, statusFilter, condFilter: _condFilter,
    setStatusFilter, setCondFilter: _setCondFilter,
  } = useLabStore()
  const { editMode, setEditMode, resetLayout } = useLayoutStore()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const [showSchedule, setShowSchedule] = useState(false)

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
    <div className="p-3 sm:p-6 animate-fade-in relative">
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

          {/* Schedule button */}
          <button
            onClick={() => setShowSchedule(true)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 flex items-center gap-1.5',
              dark ? 'bg-dark-surfaceAlt border border-dark-border text-slate-400 hover:text-slate-200'
                   : 'bg-blue-50 border border-blue-200 text-blue-600 hover:text-blue-800',
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Schedule
          </button>

          {/* Edit Layout toggle — admin only */}
          {isAdmin && (
            <button
              onClick={() => { setEditMode(!editMode); toast.info(editMode ? 'Layout saved' : 'Edit mode enabled') }}
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
          )}

          {/* Reset layout — admin only */}
          {isAdmin && editMode && (
            <button
              onClick={() => { resetLayout(activeLab); toast.warning('Layout reset to default') }}
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
                onClick={() => setStatusFilter(opt.value as StatusFilter)}
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
      {isLoading ? (
        /* ── Loading state ───────────────────────────────────────────── */
        <div className={cn(
          'flex flex-col items-center justify-center rounded-2xl border h-[360px] sm:h-[520px]',
          dark ? 'bg-dark-mapBg border-dark-border' : 'bg-slate-100 border-slate-200',
        )}>
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin opacity-30 mb-3" />
          <p className={cn('text-sm', dark ? 'text-slate-600' : 'text-slate-400')}>
            Loading workstations…
          </p>
        </div>
      ) : pcs.length === 0 ? (
        /* ── Empty state ─────────────────────────────────────────────── */
        <div className={cn(
          'flex flex-col items-center justify-center rounded-2xl border h-[360px] sm:h-[520px] gap-3',
          dark ? 'bg-dark-mapBg border-dark-border' : 'bg-slate-100 border-slate-200',
        )}>
          <Monitor className={cn('w-12 h-12', dark ? 'text-slate-700' : 'text-slate-300')} />
          <p className={cn('text-sm font-medium', dark ? 'text-slate-500' : 'text-slate-400')}>
            No workstations in this lab
          </p>
          <p className={cn('text-xs max-w-[260px] text-center', dark ? 'text-slate-600' : 'text-slate-400')}>
            PCs will appear here once the backend reports data for {lab.name}.
          </p>
        </div>
      ) : (
        /* ── Floor plan canvas ───────────────────────────────────────── */
        <div className="-mx-3 px-3 sm:mx-0 sm:px-0">
          <ZoomPanWrapper canvasW={CANVAS_W} canvasH={CANVAS_H} dark={dark}>
            <DragDropFloorPlan
              labId={activeLab}
              labName={lab.name}
              pcs={pcs}
              selectedPC={selectedPC}
              statusFilter={statusFilter as PCStatus | 'all'}
              onSelect={(pc) => setSelectedPC(pc)}
            />
          </ZoomPanWrapper>
        </div>
      )}

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
      {/* Batch actions bar (admin only) */}
      <BatchActionsBar />

      {/* Lab Schedule modal */}
      {showSchedule && (
        <LabSchedulePanel
          labId={activeLab}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  )
}
