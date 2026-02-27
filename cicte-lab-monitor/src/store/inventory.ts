import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SparePart, PartUsageLog, PartCategory } from '@/types'

// ─── Inventory Store ──────────────────────────────────────────────────────────

interface InventoryStore {
  parts:         SparePart[]
  addPart:       (p: SparePart) => void
  updatePart:    (id: string, patch: Partial<SparePart>) => void
  removePart:    (id: string) => void
  usePart:       (partId: string, log: PartUsageLog) => void
  restockPart:   (id: string, quantity: number) => void
  setParts:      (parts: SparePart[]) => void
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set) => ({
      parts: [],

      addPart: (p) => set(s => ({
        parts: [p, ...s.parts],
      })),

      updatePart: (id, patch) => set(s => ({
        parts: s.parts.map(p =>
          p.id === id ? { ...p, ...patch } : p
        ),
      })),

      removePart: (id) => set(s => ({
        parts: s.parts.filter(p => p.id !== id),
      })),

      usePart: (partId, log) => set(s => ({
        parts: s.parts.map(p =>
          p.id === partId
            ? {
                ...p,
                quantity: Math.max(0, p.quantity - log.quantity),
                usageLog: [log, ...p.usageLog],
              }
            : p
        ),
      })),

      restockPart: (id, quantity) => set(s => ({
        parts: s.parts.map(p =>
          p.id === id
            ? { ...p, quantity: p.quantity + quantity, lastRestocked: new Date().toISOString().slice(0, 10) }
            : p
        ),
      })),

      setParts: (parts) => set({ parts }),
    }),
    { name: 'cicte-inventory' }
  )
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

export function createSparePart(
  fields: Pick<SparePart, 'name' | 'category' | 'quantity' | 'location' | 'minStock'> & { unitCost?: number }
): SparePart {
  return {
    id:            `SP-${uid()}`,
    usageLog:      [],
    lastRestocked: new Date().toISOString().slice(0, 10),
    ...fields,
  }
}

export const PART_CATEGORY_META: Record<PartCategory, { label: string; color: string }> = {
  RAM:        { label: 'RAM',        color: '#3B82F6' },
  Storage:    { label: 'Storage',    color: '#8B5CF6' },
  Cable:      { label: 'Cable',      color: '#6B7280' },
  Peripheral: { label: 'Peripheral', color: '#F59E0B' },
  Display:    { label: 'Display',    color: '#06B6D4' },
  Network:    { label: 'Network',    color: '#10B981' },
  Power:      { label: 'Power',      color: '#EF4444' },
  Other:      { label: 'Other',      color: '#9CA3AF' },
}
