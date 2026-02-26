import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { PCStatus, PCCondition } from '@/types'

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Status metadata ─────────────────────────────────────────────────────────

export const STATUS_META: Record<PCStatus, { label: string; color: string; bg: string; ring: string }> = {
  available: {
    label: 'Available',
    color: 'text-emerald-500',
    bg:    'bg-emerald-500/10',
    ring:  'ring-emerald-500/40',
  },
  occupied: {
    label: 'Occupied',
    color: 'text-amber-500',
    bg:    'bg-amber-500/10',
    ring:  'ring-amber-500/40',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-rose-500',
    bg:    'bg-rose-500/10',
    ring:  'ring-rose-500/40',
  },
}

// ─── Condition metadata ──────────────────────────────────────────────────────

export const COND_META: Record<PCCondition, { label: string; color: string; dot: string }> = {
  good:         { label: 'Good',         color: 'text-emerald-500', dot: 'bg-emerald-500' },
  lagging:      { label: 'Lagging',      color: 'text-amber-500',   dot: 'bg-amber-500'   },
  needs_repair: { label: 'Needs Repair', color: 'text-orange-500',  dot: 'bg-orange-500'  },
  damaged:      { label: 'Damaged',      color: 'text-rose-500',    dot: 'bg-rose-500'    },
}

// ─── Hex colors (used for non-Tailwind canvas/inline contexts) ───────────────

export const STATUS_HEX: Record<PCStatus, string> = {
  available:   '#22c55e',
  occupied:    '#f59e0b',
  maintenance: '#f43f5e',
}

export const COND_HEX: Record<PCCondition, string> = {
  good:         '#22c55e',
  lagging:      '#f59e0b',
  needs_repair: '#f97316',
  damaged:      '#f43f5e',
}

export const STATUS_BG_HEX: Record<PCStatus, string> = {
  available:   'rgba(34,197,94,0.11)',
  occupied:    'rgba(245,158,11,0.11)',
  maintenance: 'rgba(244,63,94,0.11)',
}
