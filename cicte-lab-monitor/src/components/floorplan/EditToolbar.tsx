import { cn } from '@/lib/utils'
import { FurnIcon } from './FurnIcon'
import { FURN_LABELS } from './constants'
import type { GridMode } from './constants'
import type { FurnitureType } from '@/types'

interface Props {
  dark:       boolean
  accent:     string
  gridMode:   GridMode
  setGridMode:    (mode: GridMode) => void
  canUndoVal:     boolean
  canRedoVal:     boolean
  onUndo:         () => void
  onRedo:         () => void
  onAddFurniture: (type: FurnitureType) => void
}

export function EditToolbar({
  dark, accent, gridMode, setGridMode,
  canUndoVal, canRedoVal, onUndo, onRedo,
  onAddFurniture,
}: Props) {
  return (
    <>
      {/* Top bar: drag hint + undo/redo + grid toggle */}
      <div className="absolute top-2 left-2 sm:left-3 flex flex-wrap items-center gap-1.5 sm:gap-2 z-30 max-w-[calc(100%-16px)]">
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-medium pointer-events-none"
          style={{ background: accent + '18', color: accent, border: `1px solid ${accent}35` }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          Drag to rearrange
        </div>

        {/* Undo / Redo buttons */}
        <div className="flex items-center gap-0.5 rounded-md overflow-hidden" style={{ border: `1px solid ${dark ? '#232b3e' : '#dde3f0'}` }}>
          <button
            onClick={onUndo}
            disabled={!canUndoVal}
            title="Undo (Ctrl+Z)"
            className={cn(
              'px-2 py-1 text-[9px] font-medium transition-all flex items-center gap-1',
              canUndoVal
                ? (dark ? 'text-slate-300 hover:bg-dark-surface' : 'text-slate-600 hover:bg-slate-200')
                : (dark ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'),
            )}
            style={{ background: dark ? '#141824' : '#f8fafc' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
            Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedoVal}
            title="Redo (Ctrl+Shift+Z)"
            className={cn(
              'px-2 py-1 text-[9px] font-medium transition-all flex items-center gap-1',
              canRedoVal
                ? (dark ? 'text-slate-300 hover:bg-dark-surface' : 'text-slate-600 hover:bg-slate-200')
                : (dark ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'),
            )}
            style={{ background: dark ? '#141824' : '#f8fafc' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" /></svg>
            Redo
          </button>
        </div>

        {/* Grid toggle */}
        <div className="flex items-center rounded-md overflow-hidden" style={{ border: `1px solid ${dark ? '#232b3e' : '#dde3f0'}` }}>
          {([
            { mode: 'off'    as GridMode, label: 'No Grid' },
            { mode: 'fine'   as GridMode, label: 'Fine' },
            { mode: 'coarse' as GridMode, label: 'Coarse' },
            { mode: 'pc'     as GridMode, label: 'PC Grid' },
          ]).map(opt => (
            <button
              key={opt.mode}
              onClick={() => setGridMode(opt.mode)}
              className={cn(
                'px-2 py-0.5 text-[8px] font-medium transition-all',
                gridMode === opt.mode
                  ? 'text-white'
                  : (dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'),
              )}
              style={{
                background: gridMode === opt.mode ? accent : (dark ? '#141824' : '#f8fafc'),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom bar: add furniture */}
      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center gap-1 z-30 overflow-x-auto">
        <span className={cn('text-[9px] mr-1 flex-shrink-0', dark ? 'text-slate-600' : 'text-slate-400')}>Add:</span>
        {(['table', 'door', 'aircon', 'server', 'router', 'wifi', 'smarttv'] as const).map(type => (
          <button
            key={type}
            onClick={() => onAddFurniture(type)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-all hover:scale-105 flex-shrink-0',
              dark ? 'bg-dark-surface border border-dark-border text-slate-400 hover:text-slate-300'
                   : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700',
            )}
          >
            <FurnIcon type={type} color={dark ? '#94a3b8' : '#64748b'} />
            {FURN_LABELS[type]}
          </button>
        ))}
      </div>
    </>
  )
}
