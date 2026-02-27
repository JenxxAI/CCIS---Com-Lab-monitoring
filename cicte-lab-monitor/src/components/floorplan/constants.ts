import type { Position, FurnitureType } from '@/types'

/* ─── Constants ──────────────────────────────────────────────────────────── */

export const GRID_FINE   = 10
export const GRID_COARSE = 20
export const PC_GRID_W   = 52   // PC snap grid = tile width (44 + 8 gap)
export const PC_GRID_H   = 46   // PC snap grid = tile height (38 + 8 gap)
export const TILE_W      = 52
export const TILE_H      = 46
export const CANVAS_W    = 820
export const CANVAS_H    = 520
export const PAD         = 30

export const ALIGN_THRESHOLD = 6 // px proximity for alignment guide

export type GridMode = 'off' | 'fine' | 'coarse' | 'pc'

/* ─── Helpers ────────────────────────────────────────────────────────────── */

export const snapTo = (v: number, grid: number) => Math.round(v / grid) * grid
export const clamp  = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

/* ─── Alignment guide types ──────────────────────────────────────────────── */

export interface AlignGuide {
  type: 'h' | 'v'   // horizontal or vertical line
  pos:  number       // y for 'h', x for 'v'
  from: number       // start coord on the other axis
  to:   number       // end coord on the other axis
}

export interface DistLabel {
  x: number; y: number
  dist: number
  axis: 'h' | 'v'
}

/* ─── Drag state ─────────────────────────────────────────────────────────── */

export interface DragState {
  id:      string
  kind:    'pc' | 'furniture'
  offsetX: number
  offsetY: number
  pos:     Position
  guides:  AlignGuide[]
  dists:   DistLabel[]
}

export const FURN_LABELS: Record<FurnitureType, string> = {
  table: 'Table', door: 'Door', aircon: 'Aircon', server: 'Server',
  router: 'Router', wifi: 'WiFi AP', smarttv: 'Smart TV',
}
