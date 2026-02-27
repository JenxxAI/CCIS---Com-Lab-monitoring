import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MaintenanceEvent, MaintenanceType, MaintenanceStatus } from '@/types'

// ─── Maintenance Schedule Store ───────────────────────────────────────────────

interface ScheduleStore {
  events:       MaintenanceEvent[]
  addEvent:     (e: MaintenanceEvent) => void
  updateEvent:  (id: string, patch: Partial<MaintenanceEvent>) => void
  removeEvent:  (id: string) => void
  setEvents:    (events: MaintenanceEvent[]) => void
}

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (e) => set(s => ({
        events: [e, ...s.events],
      })),

      updateEvent: (id, patch) => set(s => ({
        events: s.events.map(e =>
          e.id === id ? { ...e, ...patch } : e
        ),
      })),

      removeEvent: (id) => set(s => ({
        events: s.events.filter(e => e.id !== id),
      })),

      setEvents: (events) => set({ events }),
    }),
    { name: 'cicte-schedule' }
  )
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

export function createMaintenanceEvent(
  fields: Pick<MaintenanceEvent, 'labId' | 'title' | 'description' | 'scheduledDate' | 'scheduledTime' | 'durationMinutes' | 'type' | 'assignedTo' | 'pcIds'> & { createdBy: string }
): MaintenanceEvent {
  return {
    id:        `ME-${uid()}`,
    status:    'scheduled',
    createdAt: new Date().toISOString(),
    notes:     '',
    ...fields,
  }
}

export const MAINT_TYPE_META: Record<MaintenanceType, { label: string; color: string }> = {
  'preventive':     { label: 'Preventive',      color: '#3B82F6' },
  'cleanup':        { label: 'Cleanup',          color: '#10B981' },
  'os-update':      { label: 'OS Update',        color: '#8B5CF6' },
  'hardware-check': { label: 'Hardware Check',   color: '#F59E0B' },
  'network':        { label: 'Network',          color: '#06B6D4' },
}

export const MAINT_STATUS_META: Record<MaintenanceStatus, { label: string; color: string }> = {
  'scheduled':   { label: 'Scheduled',   color: '#3B82F6' },
  'in-progress': { label: 'In Progress', color: '#F59E0B' },
  'completed':   { label: 'Completed',   color: '#10B981' },
  'cancelled':   { label: 'Cancelled',   color: '#6B7280' },
}
