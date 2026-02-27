import { describe, it, expect } from 'vitest'
import {
  cn,
  STATUS_META,
  COND_META,
  STATUS_HEX,
  COND_HEX,
  STATUS_BG_HEX,
} from '@/lib/utils'

// ─── cn() ────────────────────────────────────────────────────────────────────

describe('cn()', () => {
  it('merges simple class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes via clsx syntax', () => {
    const hide = false
    expect(cn('base', hide && 'hidden', 'end')).toBe('base end')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    const result = cn('px-4', 'px-2')
    expect(result).toBe('px-2')
  })

  it('resolves Tailwind color conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })

  it('handles arrays', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })

  it('handles undefined and null gracefully', () => {
    expect(cn('a', undefined, null, 'b')).toBe('a b')
  })
})

// ─── STATUS_META ─────────────────────────────────────────────────────────────

describe('STATUS_META', () => {
  it('has entries for all three statuses', () => {
    expect(Object.keys(STATUS_META)).toEqual(['available', 'occupied', 'maintenance'])
  })

  it('each entry has label, color, bg, ring', () => {
    for (const meta of Object.values(STATUS_META)) {
      expect(meta).toHaveProperty('label')
      expect(meta).toHaveProperty('color')
      expect(meta).toHaveProperty('bg')
      expect(meta).toHaveProperty('ring')
    }
  })

  it('labels are human-readable', () => {
    expect(STATUS_META.available.label).toBe('Available')
    expect(STATUS_META.occupied.label).toBe('Occupied')
    expect(STATUS_META.maintenance.label).toBe('Maintenance')
  })
})

// ─── COND_META ───────────────────────────────────────────────────────────────

describe('COND_META', () => {
  it('covers all four conditions', () => {
    expect(Object.keys(COND_META)).toEqual(['good', 'lagging', 'needs_repair', 'damaged'])
  })

  it('each entry has label, color, dot', () => {
    for (const meta of Object.values(COND_META)) {
      expect(meta).toHaveProperty('label')
      expect(meta).toHaveProperty('color')
      expect(meta).toHaveProperty('dot')
    }
  })
})

// ─── HEX maps ────────────────────────────────────────────────────────────────

describe('STATUS_HEX', () => {
  it('maps every status to a valid hex or rgba string', () => {
    for (const hex of Object.values(STATUS_HEX)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('COND_HEX', () => {
  it('maps every condition to a valid hex string', () => {
    for (const hex of Object.values(COND_HEX)) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('STATUS_BG_HEX', () => {
  it('maps every status to an rgba string', () => {
    for (const rgba of Object.values(STATUS_BG_HEX)) {
      expect(rgba).toMatch(/^rgba\(/)
    }
  })
})
