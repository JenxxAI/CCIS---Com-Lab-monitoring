import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { PCTile } from './PCTile'
import { useThemeStore, useLayoutStore } from '@/store'
import { GENERIC_GRIDS } from '@/lib/data'
import type { PC, PCStatus, Position, FurnitureItem, FurnitureType } from '@/types'
import { cn } from '@/lib/utils'

/* ─── Constants ──────────────────────────────────────────────────────────── */

const GRID_FINE   = 10
const GRID_COARSE = 20
const PC_GRID_W   = 52   // PC snap grid = tile width (44 + 8 gap)
const PC_GRID_H   = 46   // PC snap grid = tile height (38 + 8 gap)
const TILE_W      = 52
const TILE_H      = 46
const CANVAS_W    = 820
const CANVAS_H    = 520
const PAD         = 30

const ALIGN_THRESHOLD = 6 // px proximity for alignment guide

type GridMode = 'off' | 'fine' | 'coarse' | 'pc'

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const snapTo = (v: number, grid: number) => Math.round(v / grid) * grid
const clamp  = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/* ─── Alignment guide types ──────────────────────────────────────────────── */

interface AlignGuide {
  type: 'h' | 'v'   // horizontal or vertical line
  pos:  number       // y for 'h', x for 'v'
  from: number       // start coord on the other axis
  to:   number       // end coord on the other axis
}

interface DistLabel {
  x: number; y: number
  dist: number
  axis: 'h' | 'v'
}

export function getDefaultPositions(pcs: PC[], labId: string): Record<string, Position> {
  let cols: number
  if (['cl1', 'cl2', 'cl3'].includes(labId)) cols = 7
  else if (['cl4', 'cl5'].includes(labId))   cols = 6
  else cols = GENERIC_GRIDS[labId]?.cols ?? 6

  const positions: Record<string, Position> = {}
  pcs.forEach((pc, i) => {
    positions[pc.id] = {
      x: PAD + (i % cols) * TILE_W,
      y: PAD + 30 + Math.floor(i / cols) * TILE_H,
    }
  })
  return positions
}

export function getDefaultFurniture(labId: string): FurnitureItem[] {
  return [
    { id: `${labId}-instr`,  type: 'table',   x: CANVAS_W / 2 - 65, y: CANVAS_H - 70, label: "Instructor's Station", width: 130, height: 40 },
    { id: `${labId}-door`,   type: 'door',    x: CANVAS_W - 55,     y: CANVAS_H - 70, label: 'Door',                 width: 36,  height: 50 },
    { id: `${labId}-ac1`,    type: 'aircon',   x: CANVAS_W - 90,     y: 8,              label: 'Aircon',               width: 70,  height: 26 },
    { id: `${labId}-router`, type: 'router',  x: 10,                y: 8,              label: 'Router',               width: 60,  height: 34 },
    { id: `${labId}-wifi`,   type: 'wifi',    x: 80,                y: 8,              label: 'WiFi AP',              width: 54,  height: 34 },
  ]
}

/* ─── Drag state ─────────────────────────────────────────────────────────── */

interface DragState {
  id:      string
  kind:    'pc' | 'furniture'
  offsetX: number
  offsetY: number
  pos:     Position
  guides:  AlignGuide[]
  dists:   DistLabel[]
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface Props {
  labId:        string
  labName:      string
  pcs:          PC[]
  selectedPC:   PC | null
  statusFilter: PCStatus | 'all'
  onSelect:     (pc: PC) => void
}

/* ─── Minimalist SVG icons ────────────────────────────────────────────────── */

function FurnIcon({ type, color }: { type: string; color: string }) {
  const s = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'table': return (
      <svg {...s}><rect x="3" y="4" width="18" height="6" rx="1.5" /><line x1="5" y1="10" x2="5" y2="20" /><line x1="19" y1="10" x2="19" y2="20" /><line x1="3" y1="14" x2="21" y2="14" /></svg>
    )
    case 'door': return (
      <svg {...s}><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="16" cy="12" r="1.2" fill={color} /><line x1="4" y1="22" x2="20" y2="22" /></svg>
    )
    case 'aircon': return (
      <svg {...s}><rect x="2" y="4" width="20" height="10" rx="2" /><path d="M6 14v3c0 1-1 2-2 3" /><path d="M12 14v4" /><path d="M18 14v3c0 1 1 2 2 3" /><line x1="5" y1="9" x2="19" y2="9" /></svg>
    )
    case 'server': return (
      <svg {...s}><rect x="3" y="2" width="18" height="7" rx="1.5" /><rect x="3" y="11" width="18" height="7" rx="1.5" /><circle cx="7" cy="5.5" r="1" fill={color} /><circle cx="7" cy="14.5" r="1" fill={color} /><line x1="11" y1="5.5" x2="17" y2="5.5" /><line x1="11" y1="14.5" x2="17" y2="14.5" /><line x1="3" y1="20" x2="8" y2="22" /><line x1="21" y1="20" x2="16" y2="22" /></svg>
    )
    case 'router': return (
      <svg {...s}><rect x="2" y="12" width="20" height="8" rx="2" /><circle cx="6" cy="16" r="1" fill={color} /><circle cx="10" cy="16" r="1" fill={color} /><line x1="8" y1="12" x2="6" y2="4" /><line x1="16" y1="12" x2="18" y2="4" /><line x1="12" y1="12" x2="12" y2="6" /></svg>
    )
    case 'wifi': return (
      <svg {...s}><path d="M2 8.5a16 16 0 0 1 20 0" /><path d="M5.5 12a10.5 10.5 0 0 1 13 0" /><path d="M9 15.5a5 5 0 0 1 6 0" /><circle cx="12" cy="19" r="1.2" fill={color} /></svg>
    )
    case 'smarttv': return (
      <svg {...s}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><polyline points="7 10 10 8 13 11 17 7" /></svg>
    )
    default: return (
      <svg {...s}><rect x="3" y="3" width="18" height="18" rx="3" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
    )
  }
}

const FURN_LABELS: Record<FurnitureType, string> = {
  table: 'Table', door: 'Door', aircon: 'Aircon', server: 'Server',
  router: 'Router', wifi: 'WiFi AP', smarttv: 'Smart TV',
}

/* ═══ Component ══════════════════════════════════════════════════════════════ */

export function DragDropFloorPlan({ labId, labName, pcs, selectedPC, statusFilter, onSelect }: Props) {
  const { dark } = useThemeStore()
  const {
    layouts, editMode,
    initLayout, updatePCPosition, updateFurniturePosition,
    addFurniture, removeFurniture,
    pushHistory, undo, redo, canUndo, canRedo,
  } = useLayoutStore()

  const canvasRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [gridMode, setGridMode] = useState<GridMode>('pc')
  const dragRef  = useRef<DragState | null>(null)
  const storeRef = useRef({ layouts, labId, pcs, initLayout, updatePCPosition, updateFurniturePosition, pushHistory })

  const accent     = dark ? '#5b7fff' : '#3a5cf5'
  const guideColor = '#f59e0b'

  // Keep refs in sync every render
  dragRef.current  = drag
  storeRef.current = { layouts, labId, pcs, initLayout, updatePCPosition, updateFurniturePosition, pushHistory }

  /* ── Positions (merge saved + defaults) ──────────────────────────────── */

  const pcPositions = useMemo(() => {
    const defaults = getDefaultPositions(pcs, labId)
    const saved    = layouts[labId]?.pcPositions
    return saved ? { ...defaults, ...saved } : defaults
  }, [layouts, labId, pcs])

  const furniture = useMemo(() => {
    return layouts[labId]?.furniture ?? getDefaultFurniture(labId)
  }, [layouts, labId])

  /* ── Filter helper ──────────────────────────────────────────────────── */

  const dim = (pc: PC) => statusFilter !== 'all' && pc.status !== statusFilter

  /* ── Position getters (use drag pos for active item) ────────────────── */

  const getPCPos = (pcId: string): Position => {
    if (drag?.id === pcId && drag.kind === 'pc') return drag.pos
    return pcPositions[pcId] ?? { x: 0, y: 0 }
  }

  const getFurnPos = (fId: string): Position => {
    if (drag?.id === fId && drag.kind === 'furniture') return drag.pos
    const item = furniture.find(f => f.id === fId)
    return item ? { x: item.x, y: item.y } : { x: 0, y: 0 }
  }

  /* ── Smart snap: snap to grid + align to neighbors ─────────────────── */

  const computeSnap = useCallback((rawX: number, rawY: number, dragId: string, dragKind: 'pc' | 'furniture'): { pos: Position; guides: AlignGuide[]; dists: DistLabel[] } => {
    const itemW = dragKind === 'pc' ? 44 : (furniture.find(f => f.id === dragId)?.width ?? 44)
    const itemH = dragKind === 'pc' ? 38 : (furniture.find(f => f.id === dragId)?.height ?? 38)

    // Determine grid snap size
    let gridX: number, gridY: number
    if (dragKind === 'pc') {
      gridX = PC_GRID_W; gridY = PC_GRID_H
    } else if (gridMode === 'fine') {
      gridX = GRID_FINE; gridY = GRID_FINE
    } else if (gridMode === 'coarse') {
      gridX = GRID_COARSE; gridY = GRID_COARSE
    } else {
      gridX = GRID_FINE; gridY = GRID_FINE
    }

    // Grid snap
    let x = snapTo(rawX, gridX)
    let y = snapTo(rawY, gridY)

    // Collect all other item rects (center/edges)
    interface Rect { id: string; x: number; y: number; w: number; h: number }
    const rects: Rect[] = []

    pcs.forEach(pc => {
      if (pc.id === dragId) return
      const p = pcPositions[pc.id] ?? { x: 0, y: 0 }
      rects.push({ id: pc.id, x: p.x, y: p.y, w: 44, h: 38 })
    })
    furniture.forEach(f => {
      if (f.id === dragId) return
      rects.push({ id: f.id, x: f.x, y: f.y, w: f.width, h: f.height })
    })

    const guides: AlignGuide[] = []

    // Dragged item edges + center
    const dCx = x + itemW / 2, dCy = y + itemH / 2
    const dL = x, dR = x + itemW, dT = y, dB = y + itemH

    // Check alignment with each neighbor
    for (const r of rects) {
      const rCx = r.x + r.w / 2, rCy = r.y + r.h / 2
      const rL = r.x, rR = r.x + r.w, rT = r.y, rB = r.y + r.h

      // Vertical alignment (x-axis alignment → draws vertical line)
      // Left-left
      if (Math.abs(dL - rL) < ALIGN_THRESHOLD) {
        x = rL
        guides.push({ type: 'v', pos: rL, from: Math.min(y, r.y) - 4, to: Math.max(dB, rB) + 4 })
      }
      // Right-right
      else if (Math.abs(dR - rR) < ALIGN_THRESHOLD) {
        x = rR - itemW
        guides.push({ type: 'v', pos: rR, from: Math.min(y, r.y) - 4, to: Math.max(dB, rB) + 4 })
      }
      // Center-center X
      else if (Math.abs(dCx - rCx) < ALIGN_THRESHOLD) {
        x = rCx - itemW / 2
        guides.push({ type: 'v', pos: rCx, from: Math.min(y, r.y) - 4, to: Math.max(dB, rB) + 4 })
      }

      // Horizontal alignment (y-axis alignment → draws horizontal line)
      // Top-top
      if (Math.abs(dT - rT) < ALIGN_THRESHOLD) {
        y = rT
        guides.push({ type: 'h', pos: rT, from: Math.min(x, r.x) - 4, to: Math.max(dR, rR) + 4 })
      }
      // Bottom-bottom
      else if (Math.abs(dB - rB) < ALIGN_THRESHOLD) {
        y = rB - itemH
        guides.push({ type: 'h', pos: rB, from: Math.min(x, r.x) - 4, to: Math.max(dR, rR) + 4 })
      }
      // Center-center Y
      else if (Math.abs(dCy - rCy) < ALIGN_THRESHOLD) {
        y = rCy - itemH / 2
        guides.push({ type: 'h', pos: rCy, from: Math.min(x, r.x) - 4, to: Math.max(dR, rR) + 4 })
      }
    }

    // Equal distance labels — find nearest neighbors on each axis
    const dists: DistLabel[] = []
    const finalL = x, finalR = x + itemW, finalT = y, finalB = y + itemH
    const finalCx = x + itemW / 2, finalCy = y + itemH / 2

    // Horizontal neighbors (same row ±)
    const hNeighborsLeft  = rects.filter(r => r.x + r.w <= finalL && Math.abs((r.y + r.h/2) - finalCy) < itemH * 1.2)
    const hNeighborsRight = rects.filter(r => r.x >= finalR && Math.abs((r.y + r.h/2) - finalCy) < itemH * 1.2)

    if (hNeighborsLeft.length > 0) {
      const closest = hNeighborsLeft.reduce((a, b) => (a.x + a.w > b.x + b.w ? a : b))
      const gap = finalL - (closest.x + closest.w)
      if (gap > 0 && gap < 120) {
        dists.push({ x: closest.x + closest.w + gap / 2, y: finalCy - 5, dist: Math.round(gap), axis: 'h' })
      }
    }
    if (hNeighborsRight.length > 0) {
      const closest = hNeighborsRight.reduce((a, b) => (a.x < b.x ? a : b))
      const gap = closest.x - finalR
      if (gap > 0 && gap < 120) {
        dists.push({ x: finalR + gap / 2, y: finalCy - 5, dist: Math.round(gap), axis: 'h' })
      }
    }

    // Vertical neighbors (same column ±)
    const vNeighborsAbove = rects.filter(r => r.y + r.h <= finalT && Math.abs((r.x + r.w/2) - finalCx) < itemW * 1.2)
    const vNeighborsBelow = rects.filter(r => r.y >= finalB && Math.abs((r.x + r.w/2) - finalCx) < itemW * 1.2)

    if (vNeighborsAbove.length > 0) {
      const closest = vNeighborsAbove.reduce((a, b) => (a.y + a.h > b.y + b.h ? a : b))
      const gap = finalT - (closest.y + closest.h)
      if (gap > 0 && gap < 120) {
        dists.push({ x: finalCx + 6, y: closest.y + closest.h + gap / 2, dist: Math.round(gap), axis: 'v' })
      }
    }
    if (vNeighborsBelow.length > 0) {
      const closest = vNeighborsBelow.reduce((a, b) => (a.y < b.y ? a : b))
      const gap = closest.y - finalB
      if (gap > 0 && gap < 120) {
        dists.push({ x: finalCx + 6, y: finalB + gap / 2, dist: Math.round(gap), axis: 'v' })
      }
    }

    return { pos: { x: clamp(x, 0, CANVAS_W - itemW), y: clamp(y, 0, CANVAS_H - itemH) }, guides, dists }
  }, [pcPositions, furniture, gridMode, pcs])

  /* ── Drag start ────────────────────────────────────────────────────── */

  const startDrag = (e: React.PointerEvent, id: string, kind: 'pc' | 'furniture') => {
    if (!editMode) return
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()

    let itemX: number, itemY: number
    if (kind === 'pc') {
      const p = pcPositions[id] ?? { x: 0, y: 0 }
      itemX = p.x; itemY = p.y
    } else {
      const f = furniture.find(f => f.id === id)
      itemX = f?.x ?? 0; itemY = f?.y ?? 0
    }

    const newDrag: DragState = {
      id, kind,
      offsetX: e.clientX - rect.left - itemX,
      offsetY: e.clientY - rect.top  - itemY,
      pos: { x: itemX, y: itemY },
      guides: [],
      dists: [],
    }
    dragRef.current = newDrag
    setDrag(newDrag)
  }

  /* ── Drag move + end (document listeners) ──────────────────────────── */

  useEffect(() => {
    if (!drag) return

    const onMove = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      setDrag(d => {
        if (!d) return null
        const rawX = e.clientX - rect.left - d.offsetX
        const rawY = e.clientY - rect.top  - d.offsetY
        const { pos, guides, dists } = computeSnap(rawX, rawY, d.id, d.kind)
        if (pos.x === d.pos.x && pos.y === d.pos.y && guides.length === d.guides.length) return d
        const updated = { ...d, pos, guides, dists }
        dragRef.current = updated
        return updated
      })
    }

    const onUp = () => {
      const d = dragRef.current
      const s = storeRef.current
      if (d) {
        // Save current state before committing new position
        s.pushHistory(s.labId)
        if (!s.layouts[s.labId]) {
          const allPc = { ...getDefaultPositions(s.pcs, s.labId) }
          if (d.kind === 'pc') allPc[d.id] = d.pos
          const allFurn = getDefaultFurniture(s.labId).map(f =>
            f.id === d.id ? { ...f, x: d.pos.x, y: d.pos.y } : f
          )
          s.initLayout(s.labId, allPc, allFurn)
        } else if (d.kind === 'pc') {
          s.updatePCPosition(s.labId, d.id, d.pos)
        } else {
          s.updateFurniturePosition(s.labId, d.id, d.pos)
        }
      }
      dragRef.current = null
      setDrag(null)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!drag, computeSnap])

  /* ── Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z) ───────────────────── */

  useEffect(() => {
    if (!editMode) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo(labId)
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey)) ) {
        e.preventDefault()
        redo(labId)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo(labId)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [editMode, labId, undo, redo])

  /* ── Add furniture helper ──────────────────────────────────────────── */

  const addNewFurniture = (type: FurnitureItem['type']) => {
    const labels:  Record<string, string> = { table: 'Table', door: 'Door', aircon: 'Aircon', server: 'Server', router: 'Router', wifi: 'WiFi AP', smarttv: 'Smart TV' }
    const widths:  Record<string, number> = { table: 120, door: 36, aircon: 70, server: 50, router: 60, wifi: 54, smarttv: 90 }
    const heights: Record<string, number> = { table: 40,  door: 50, aircon: 26, server: 80, router: 34, wifi: 34, smarttv: 50 }

    const item: FurnitureItem = {
      id:     `${labId}-${type}-${Date.now()}`,
      type,
      x:      CANVAS_W / 2 - (widths[type] ?? 60) / 2,
      y:      CANVAS_H / 2 - (heights[type] ?? 40) / 2,
      label:  labels[type] ?? type,
      width:  widths[type] ?? 80,
      height: heights[type] ?? 40,
    }

    if (!layouts[labId]) {
      initLayout(labId, getDefaultPositions(pcs, labId), [...getDefaultFurniture(labId), item])
    } else {
      addFurniture(labId, item)
    }
  }

  /* ═══ Render ═══════════════════════════════════════════════════════════ */

  const gridSize = gridMode === 'fine' ? GRID_FINE : gridMode === 'coarse' ? GRID_COARSE : gridMode === 'pc' ? PC_GRID_W : 0
  const gridSizeY = gridMode === 'pc' ? PC_GRID_H : gridSize

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative rounded-2xl border select-none',
        dark ? 'bg-dark-mapBg border-dark-border' : 'bg-slate-100 border-slate-200',
      )}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        touchAction: 'none',
        outline: editMode ? `2px solid ${accent}40` : 'none',
        outlineOffset: -2,
      }}
    >
      {/* ── Grid pattern (edit mode) ──────────────────────────────────── */}
      {editMode && gridMode !== 'off' && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.12 }}>
          <defs>
            <pattern id="dnd-grid" width={gridSize} height={gridSizeY} patternUnits="userSpaceOnUse">
              <path
                d={`M ${gridSize} 0 L 0 0 0 ${gridSizeY}`}
                fill="none" stroke={dark ? '#5b7fff' : '#3a5cf5'} strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dnd-grid)" />
        </svg>
      )}

      {/* ── Alignment guides overlay ─────────────────────────────────── */}
      {drag && drag.guides.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" style={{ overflow: 'visible' }}>
          {drag.guides.map((g, i) => (
            g.type === 'v'
              ? <line key={i} x1={g.pos} y1={g.from} x2={g.pos} y2={g.to}
                  stroke={guideColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
              : <line key={i} x1={g.from} y1={g.pos} x2={g.to} y2={g.pos}
                  stroke={guideColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
          ))}
        </svg>
      )}

      {/* ── Distance labels overlay ──────────────────────────────────── */}
      {drag && drag.dists.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {drag.dists.map((d, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center"
              style={{
                left: d.x - 14, top: d.y - 6,
                width: 28, height: 14,
                background: guideColor,
                borderRadius: 3,
                fontSize: 8,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: 0.3,
                lineHeight: 1,
              }}
            >
              {d.dist}px
            </div>
          ))}
        </div>
      )}

      {/* ── Lab name ──────────────────────────────────────────────────── */}
      <div className={cn(
        'absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-widest uppercase pointer-events-none z-20',
        dark ? 'text-slate-600' : 'text-slate-400',
      )}>
        {labName}
      </div>

      {/* ── Edit badge + grid toggle ──────────────────────────────────── */}
      {editMode && (
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
              onClick={() => undo(labId)}
              disabled={!canUndo(labId)}
              title="Undo (Ctrl+Z)"
              className={cn(
                'px-2 py-1 text-[9px] font-medium transition-all flex items-center gap-1',
                canUndo(labId)
                  ? (dark ? 'text-slate-300 hover:bg-dark-surface' : 'text-slate-600 hover:bg-slate-200')
                  : (dark ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'),
              )}
              style={{ background: dark ? '#141824' : '#f8fafc' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
              Undo
            </button>
            <button
              onClick={() => redo(labId)}
              disabled={!canRedo(labId)}
              title="Redo (Ctrl+Shift+Z)"
              className={cn(
                'px-2 py-1 text-[9px] font-medium transition-all flex items-center gap-1',
                canRedo(labId)
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
      )}

      {/* ── Furniture items ───────────────────────────────────────────── */}
      {furniture.map(item => {
        const pos = getFurnPos(item.id)
        const isDragging = drag?.id === item.id
        return (
          <div
            key={item.id}
            className={cn(
              'absolute flex flex-col items-center justify-center rounded-lg border-dashed border-2 transition-shadow',
              dark ? 'border-dark-border text-slate-500'
                   : 'border-slate-300 text-slate-400',
              editMode && !isDragging && 'cursor-grab hover:shadow-md',
              isDragging && 'cursor-grabbing shadow-xl z-50',
              !editMode && 'pointer-events-none',
            )}
            style={{
              left: pos.x, top: pos.y,
              width: item.width, height: item.height,
              background: dark ? 'rgba(20,30,46,0.85)' : 'rgba(226,232,240,0.85)',
              transition: isDragging ? 'none' : 'box-shadow 150ms',
              transform: isDragging ? 'scale(1.05)' : undefined,
            }}
            onPointerDown={e => startDrag(e, item.id, 'furniture')}
          >
            <FurnIcon type={item.type} color={dark ? '#64748b' : '#94a3b8'} />
            <span className="text-[8px] leading-tight text-center mt-0.5">{item.label}</span>

            {/* Delete button (edit mode only) */}
            {editMode && !isDragging && (
              <button
                className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shadow-sm hover:scale-110 transition-transform"
                style={{ background: '#f43f5e' }}
                onPointerDown={e => e.stopPropagation()}
                onClick={() => removeFurniture(labId, item.id)}
              >
                ✕
              </button>
            )}
          </div>
        )
      })}

      {/* ── PC tiles ──────────────────────────────────────────────────── */}
      {pcs.map(pc => {
        const pos        = getPCPos(pc.id)
        const isDragging = drag?.id === pc.id
        const isDimmed   = dim(pc)
        const isSelected = selectedPC?.id === pc.id

        return (
          <div
            key={pc.id}
            className={cn(
              'absolute',
              editMode && !isDragging && 'cursor-grab',
              isDragging && 'cursor-grabbing',
            )}
            style={{
              left: pos.x, top: pos.y,
              transition: isDragging ? 'none' : 'left 80ms, top 80ms',
              zIndex: isDragging ? 100 : isSelected ? 10 : 1,
              transform: isDragging ? 'scale(1.12)' : undefined,
            }}
            onPointerDown={e => { if (editMode) startDrag(e, pc.id, 'pc') }}
          >
            <PCTile
              pc={pc}
              isSelected={isSelected}
              dimmed={isDimmed}
              onSelect={editMode ? () => {} : onSelect}
              accent={accent}
            />
          </div>
        )
      })}

      {/* ── Add-furniture toolbar (edit mode) ─────────────────────────── */}
      {editMode && (
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 flex items-center gap-1 z-30 overflow-x-auto">
          <span className={cn('text-[9px] mr-1 flex-shrink-0', dark ? 'text-slate-600' : 'text-slate-400')}>Add:</span>
          {(['table', 'door', 'aircon', 'server', 'router', 'wifi', 'smarttv'] as const).map(type => (
            <button
              key={type}
              onClick={() => addNewFurniture(type)}
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
      )}
    </div>
  )
}
