import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RepairTicket, TicketPriority, TicketStatus } from '@/types'

// ─── Repair Ticket Store ──────────────────────────────────────────────────────

interface TicketStore {
  tickets:       RepairTicket[]
  addTicket:     (t: RepairTicket) => void
  updateTicket:  (id: string, patch: Partial<RepairTicket>) => void
  removeTicket:  (id: string) => void
  resolveTicket: (id: string, resolution: string) => void
  setTickets:    (tickets: RepairTicket[]) => void
}

export const useTicketStore = create<TicketStore>()(
  persist(
    (set) => ({
      tickets: [],

      addTicket: (t) => set(s => ({
        tickets: [t, ...s.tickets],
      })),

      updateTicket: (id, patch) => set(s => ({
        tickets: s.tickets.map(t =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
        ),
      })),

      removeTicket: (id) => set(s => ({
        tickets: s.tickets.filter(t => t.id !== id),
      })),

      resolveTicket: (id, resolution) => set(s => ({
        tickets: s.tickets.map(t =>
          t.id === id
            ? {
                ...t,
                status: 'resolved' as TicketStatus,
                resolution,
                resolvedAt: new Date().toISOString(),
                updatedAt:  new Date().toISOString(),
              }
            : t
        ),
      })),

      setTickets: (tickets) => set({ tickets }),
    }),
    { name: 'cicte-tickets' }
  )
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

export function createTicket(
  fields: Pick<RepairTicket, 'pcId' | 'labId' | 'title' | 'description' | 'priority' | 'assignedTo' | 'estimatedMinutes'> & { createdBy: string }
): RepairTicket {
  const now = new Date().toISOString()
  return {
    id:        `TKT-${uid()}`,
    status:    'open',
    createdAt: now,
    updatedAt: now,
    partsUsed: [],
    ...fields,
  }
}

export const PRIORITY_META: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:      { label: 'Low',      color: '#6B7280', bg: '#6B728018' },
  medium:   { label: 'Medium',   color: '#F59E0B', bg: '#F59E0B18' },
  high:     { label: 'High',     color: '#EF4444', bg: '#EF444418' },
  critical: { label: 'Critical', color: '#DC2626', bg: '#DC262630' },
}

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; color: string }> = {
  'open':        { label: 'Open',        color: '#3B82F6' },
  'in-progress': { label: 'In Progress', color: '#F59E0B' },
  'resolved':    { label: 'Resolved',    color: '#10B981' },
  'closed':      { label: 'Closed',      color: '#6B7280' },
}
