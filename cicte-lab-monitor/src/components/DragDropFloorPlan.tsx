import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { PCTile } from './PCTile'
import { useThemeStore, useLayoutStore } from '@/store'
import { toast } from '@/store/toast'
import { GENERIC_GRIDS } from '@/lib/data'
import type { PC, PCStatus, Position, FurnitureItem } from '@/types'
import { cn } from '@/lib/utils'
import {
  GRID_FINE, GRID_COARSE, PC_GRID_W, PC_GRID_H,
  TILE_W, TILE_H, CANVAS_W, CANVAS_H, PAD,
  ALIGN_THRESHOLD, snapTo, clamp,
  type GridMode, type AlignGuide, type DistLabel, type DragState, type GroupMember,
} from './floorplan/constants'
import { FurnIcon } from './floorplan/FurnIcon'
import { AlignmentOverlay } from './floorplan/AlignmentOverlay'
import { EditToolbar } from './floorplan/EditToolbar'

function getDefaultPositions(pcs: PC[], labId: string): Record<string, Position> {
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

function getDefaultFurniture(labId: string): FurnitureItem[] {
  return [
    { id: `${labId}-instr`,  type: 'table',   x: CANVAS_W / 2 - 65, y: CANVAS_H - 70, label: "Instructor's Station", width: 130, height: 40 },
    { id: `${labId}-door`,   type: 'door',    x: CANVAS_W - 55,     y: CANVAS_H - 70, label: 'Door',                 width: 36,  height: 50 },
    { id: `${labId}-ac1`,    type: 'aircon',   x: CANVAS_W - 90,     y: 8,              label: 'Aircon',               width: 70,  height: 26 },
    { id: `${labId}-router`, type: 'router',  x: 10,                y: 8,              label: 'Router',               width: 60,  height: 34 },
    { id: `${labId}-wifi`,   type: 'wifi',    x: 80,                y: 8,              label: 'WiFi AP',              width: 54,  height: 34 },
  ]
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
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const dragRef  = useRef<DragState | null>(null)

  // Marquee (rubber-band) selection
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; curX: number; curY: number } | null>(null)
  const marqueeRef = useRef(marquee)
  marqueeRef.current = marquee
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

  /** Compute group-member delta from the primary item's movement */
  const groupDelta = drag ? { x: drag.pos.x - drag.startPos.x, y: drag.pos.y - drag.startPos.y } : { x: 0, y: 0 }

  const getPCPos = (pcId: string): Position => {
    // Primary drag item
    if (drag?.id === pcId && drag.kind === 'pc') return drag.pos
    // Group member — apply the same delta
    if (drag && drag.group.length > 0) {
      const member = drag.group.find(m => m.id === pcId && m.kind === 'pc')
      if (member) {
        return {
          x: clamp(member.startPos.x + groupDelta.x, 0, CANVAS_W - 44),
          y: clamp(member.startPos.y + groupDelta.y, 0, CANVAS_H - 38),
        }
      }
    }
    return pcPositions[pcId] ?? { x: 0, y: 0 }
  }

  const getFurnPos = (fId: string): Position => {
    if (drag?.id === fId && drag.kind === 'furniture') return drag.pos
    // Group member
    if (drag && drag.group.length > 0) {
      const member = drag.group.find(m => m.id === fId && m.kind === 'furniture')
      if (member) {
        const item = furniture.find(f => f.id === fId)
        return {
          x: clamp(member.startPos.x + groupDelta.x, 0, CANVAS_W - (item?.width ?? 44)),
          y: clamp(member.startPos.y + groupDelta.y, 0, CANVAS_H - (item?.height ?? 38)),
        }
      }
    }
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

    // Build group: if the dragged item is in the selection and there are
    // multiple items selected, all OTHER selected items become group members.
    let group: GroupMember[] = []
    if (selection.has(id) && selection.size > 1) {
      group = [...selection]
        .filter(sid => sid !== id)
        .map(sid => {
          const isPC = pcs.some(pc => pc.id === sid)
          if (isPC) {
            const pos = pcPositions[sid] ?? { x: 0, y: 0 }
            return { id: sid, kind: 'pc' as const, startPos: pos }
          } else {
            const fi = furniture.find(f => f.id === sid)
            return { id: sid, kind: 'furniture' as const, startPos: { x: fi?.x ?? 0, y: fi?.y ?? 0 } }
          }
        })
    }

    const newDrag: DragState = {
      id, kind,
      offsetX: e.clientX - rect.left - itemX,
      offsetY: e.clientY - rect.top  - itemY,
      pos: { x: itemX, y: itemY },
      startPos: { x: itemX, y: itemY },
      guides: [],
      dists: [],
      group,
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
        // Save current state before committing new positions
        s.pushHistory(s.labId)

        const delta = { x: d.pos.x - d.startPos.x, y: d.pos.y - d.startPos.y }

        if (!s.layouts[s.labId]) {
          // First layout edit — initialise with defaults then apply drag
          const allPc = { ...getDefaultPositions(s.pcs, s.labId) }
          const allFurn = [...getDefaultFurniture(s.labId)]

          // Apply primary item
          if (d.kind === 'pc') allPc[d.id] = d.pos
          else {
            const idx = allFurn.findIndex(f => f.id === d.id)
            if (idx >= 0) allFurn[idx] = { ...allFurn[idx], x: d.pos.x, y: d.pos.y }
          }

          // Apply group members
          for (const m of d.group) {
            const newX = m.startPos.x + delta.x
            const newY = m.startPos.y + delta.y
            if (m.kind === 'pc') {
              allPc[m.id] = { x: clamp(newX, 0, CANVAS_W - 44), y: clamp(newY, 0, CANVAS_H - 38) }
            } else {
              const idx = allFurn.findIndex(f => f.id === m.id)
              if (idx >= 0) {
                allFurn[idx] = { ...allFurn[idx], x: clamp(newX, 0, CANVAS_W - allFurn[idx].width), y: clamp(newY, 0, CANVAS_H - allFurn[idx].height) }
              }
            }
          }

          s.initLayout(s.labId, allPc, allFurn)
        } else {
          // Commit primary
          if (d.kind === 'pc') s.updatePCPosition(s.labId, d.id, d.pos)
          else s.updateFurniturePosition(s.labId, d.id, d.pos)

          // Commit group members
          for (const m of d.group) {
            const newX = m.startPos.x + delta.x
            const newY = m.startPos.y + delta.y
            if (m.kind === 'pc') {
              s.updatePCPosition(s.labId, m.id, { x: clamp(newX, 0, CANVAS_W - 44), y: clamp(newY, 0, CANVAS_H - 38) })
            } else {
              const fi = furniture.find(f => f.id === m.id)
              s.updateFurniturePosition(s.labId, m.id, {
                x: clamp(newX, 0, CANVAS_W - (fi?.width ?? 44)),
                y: clamp(newY, 0, CANVAS_H - (fi?.height ?? 38)),
              })
            }
          }
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

  /* ── Keyboard shortcuts ─────────────────────────────────────────── */
  //  Ctrl+Z undo · Ctrl+Shift+Z / Ctrl+Y redo
  //  Ctrl+A select all · Delete/Backspace remove selected furniture
  //  Escape  clear selection / deselect PC / exit edit mode

  useEffect(() => {
    if (!editMode) return
    const handler = (e: KeyboardEvent) => {
      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo(labId)
      }
      // Redo
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo(labId)
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        redo(labId)
      }
      // Select all
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        const allIds = new Set([...pcs.map(p => p.id), ...furniture.map(f => f.id)])
        setSelection(allIds)
      }
      // Delete selected furniture items
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selection.size > 0) {
        e.preventDefault()
        // Only delete furniture, not PCs
        const furnIds = [...selection].filter(id => furniture.some(f => f.id === id))
        if (furnIds.length > 0) {
          pushHistory(labId)
          furnIds.forEach(id => removeFurniture(labId, id))
          toast.info(`Removed ${furnIds.length} item${furnIds.length > 1 ? 's' : ''}`)
        }
        setSelection(new Set())
      }
      // Escape: clear selection → deselect PC → exit edit
      else if (e.key === 'Escape') {
        e.preventDefault()
        if (selection.size > 0) {
          setSelection(new Set())
        } else if (selectedPC) {
          onSelect(selectedPC) // toggle off
        } else {
          useLayoutStore.getState().setEditMode(false)
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [editMode, labId, undo, redo, pushHistory, removeFurniture, selection, selectedPC, onSelect, pcs, furniture])

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
    toast.success(`Added ${labels[type] ?? type}`)
  }

  /** Toggle an item in/out of the selection. Shift/Ctrl = additive, plain = exclusive */
  const toggleSelect = (id: string, additive: boolean) => {
    setSelection(prev => {
      if (additive) {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id); else next.add(id)
        return next
      }
      // Plain click — exclusive select (or deselect if already the only one)
      if (prev.has(id) && prev.size === 1) return new Set<string>()
      return new Set([id])
    })
  }

  /* ── Marquee (rubber-band) selection ───────────────────────────────── */

  const startMarquee = (e: React.PointerEvent) => {
    if (!editMode || drag) return
    // Only start marquee on direct canvas clicks (background)
    if (e.target !== canvasRef.current) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMarquee({ startX: x, startY: y, curX: x, curY: y })
    marqueeRef.current = { startX: x, startY: y, curX: x, curY: y }
  }

  useEffect(() => {
    if (!marquee) return

    const onMove = (e: PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const curX = Math.max(0, Math.min(CANVAS_W, e.clientX - rect.left))
      const curY = Math.max(0, Math.min(CANVAS_H, e.clientY - rect.top))
      setMarquee(m => m ? { ...m, curX, curY } : null)
      marqueeRef.current = marqueeRef.current ? { ...marqueeRef.current, curX, curY } : null
    }

    const onUp = () => {
      const m = marqueeRef.current
      if (m) {
        const left   = Math.min(m.startX, m.curX)
        const right  = Math.max(m.startX, m.curX)
        const top    = Math.min(m.startY, m.curY)
        const bottom = Math.max(m.startY, m.curY)

        // Only select if the marquee is big enough (avoid accidental)
        if (right - left > 5 && bottom - top > 5) {
          const ids = new Set<string>()
          pcs.forEach(pc => {
            const pos = pcPositions[pc.id] ?? { x: 0, y: 0 }
            const cx = pos.x + 22, cy = pos.y + 19 // tile center
            if (cx >= left && cx <= right && cy >= top && cy <= bottom) ids.add(pc.id)
          })
          furniture.forEach(f => {
            const cx = f.x + f.width / 2, cy = f.y + f.height / 2
            if (cx >= left && cx <= right && cy >= top && cy <= bottom) ids.add(f.id)
          })
          setSelection(ids)
        }
      }
      setMarquee(null)
      marqueeRef.current = null
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!marquee, pcs, pcPositions, furniture])

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
      onClick={() => { if (editMode && !marquee) setSelection(new Set()) }}
      onPointerDown={startMarquee}
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

      {/* ── Alignment + distance overlays ────────────────────────────── */}
      <AlignmentOverlay drag={drag} guideColor={guideColor} />

      {/* ── Lab name ──────────────────────────────────────────────────── */}
      <div className={cn(
        'absolute left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-widest uppercase pointer-events-none z-10',
        editMode ? 'top-10' : 'top-3',
        dark ? 'text-slate-600' : 'text-slate-400',
      )}>
        {labName}
      </div>

      {/* ── Edit mode toolbar ────────────────────────────────────────── */}
      {editMode && (
        <>
          <EditToolbar
            dark={dark}
            accent={accent}
            gridMode={gridMode}
            setGridMode={setGridMode}
            canUndoVal={canUndo(labId)}
            canRedoVal={canRedo(labId)}
            onUndo={() => undo(labId)}
            onRedo={() => redo(labId)}
            onAddFurniture={addNewFurniture}
          />
          {/* Keyboard hint — sits above the Add Item bar */}
          <div className={cn(
            'absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 text-[9px] px-3 py-1 rounded-full pointer-events-none z-20 whitespace-nowrap',
            dark ? 'bg-dark-surface/80 text-slate-600' : 'bg-white/80 text-slate-400',
          )}>
            Ctrl+Z undo · Ctrl+Y redo · Del remove · Esc deselect · Shift+Click multi-select · Ctrl+A select all
          </div>
        </>
      )}

      {/* ── Furniture items ───────────────────────────────────────────── */}
      {furniture.map(item => {
        const pos = getFurnPos(item.id)
        const isDragging = drag?.id === item.id || (drag?.group.some(m => m.id === item.id) ?? false)
        const isSelected = selection.has(item.id)
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
              isSelected && 'ring-2 ring-offset-1',
            )}
            style={{
              left: pos.x, top: pos.y,
              width: item.width, height: item.height,
              background: dark ? 'rgba(20,30,46,0.85)' : 'rgba(226,232,240,0.85)',
              transition: isDragging ? 'none' : 'box-shadow 150ms',
              transform: isDragging ? 'scale(1.05)' : undefined,
              ...(isSelected ? { borderColor: accent } : {}),
            }}
            onPointerDown={e => {
              if (!editMode) return
              // If not in current selection, select it first (unless shift held)
              if (!selection.has(item.id)) toggleSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey)
              startDrag(e, item.id, 'furniture')
            }}
            onClick={(e) => { if (editMode) { e.stopPropagation(); toggleSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey) } }}
          >
            <FurnIcon type={item.type} color={dark ? '#64748b' : '#94a3b8'} />
            <span className="text-[8px] leading-tight text-center mt-0.5">{item.label}</span>

            {/* Delete button (edit mode only) */}
            {editMode && !isDragging && (
              <button
                className="absolute -top-2 -right-2 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white shadow-sm hover:scale-110 transition-transform"
                style={{ background: '#f43f5e' }}
                onPointerDown={e => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); removeFurniture(labId, item.id); setSelection(prev => { const n = new Set(prev); n.delete(item.id); return n }) }}
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
        const isDragging = drag?.id === pc.id || (drag?.group.some(m => m.id === pc.id) ?? false)
        const isDimmed   = dim(pc)
        const isSelected = selectedPC?.id === pc.id
        const isInSelection = selection.has(pc.id)

        return (
          <div
            key={pc.id}
            className={cn(
              'absolute',
              editMode && !isDragging && 'cursor-grab',
              isDragging && 'cursor-grabbing',
              editMode && isInSelection && 'ring-2 ring-offset-1 rounded-lg',
            )}
            style={{
              left: pos.x, top: pos.y,
              transition: isDragging ? 'none' : 'left 80ms, top 80ms',
              zIndex: isDragging ? 100 : isSelected ? 10 : 1,
              transform: isDragging ? 'scale(1.12)' : undefined,
              ...(editMode && isInSelection ? { ['--tw-ring-color' as string]: accent } : {}),
            }}
            onPointerDown={e => {
              if (!editMode) return
              if (!selection.has(pc.id)) toggleSelect(pc.id, e.shiftKey || e.ctrlKey || e.metaKey)
              startDrag(e, pc.id, 'pc')
            }}
            onClick={e => { if (editMode) { e.stopPropagation(); toggleSelect(pc.id, e.shiftKey || e.ctrlKey || e.metaKey) } }}
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

      {/* ── Marquee selection rectangle ──────────────────────────────── */}
      {marquee && (() => {
        const left   = Math.min(marquee.startX, marquee.curX)
        const top    = Math.min(marquee.startY, marquee.curY)
        const width  = Math.abs(marquee.curX - marquee.startX)
        const height = Math.abs(marquee.curY - marquee.startY)
        return (
          <div
            className="absolute pointer-events-none z-[200]"
            style={{
              left, top, width, height,
              border: `1.5px dashed ${accent}`,
              background: `${accent}15`,
              borderRadius: 4,
            }}
          />
        )
      })()}

      {/* ── Selection count indicator ───────────────────────────────── */}
      {editMode && selection.size > 1 && !drag && (
        <div
          className="absolute top-3 right-3 z-30 px-2 py-1 rounded-full text-[10px] font-semibold text-white"
          style={{ background: accent }}
        >
          {selection.size} selected
        </div>
      )}

    </div>
  )
}
