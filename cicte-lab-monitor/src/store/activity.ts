import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ActivityEvent, ActivityType } from '@/types'

// ─── Activity Log Store ──────────────────────────────────────────────────────

interface ActivityStore {
  events:     ActivityEvent[]
  addEvent:   (e: ActivityEvent) => void
  setEvents:  (events: ActivityEvent[]) => void
  clearAll:   () => void
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (e) => set(s => ({
        events: [e, ...s.events].slice(0, 500),  // keep max 500
      })),

      setEvents: (events) => set({ events }),

      clearAll: () => set({ events: [] }),
    }),
    { name: 'cicte-activity' }
  )
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

export function logActivity(
  fields: Pick<ActivityEvent, 'pcId' | 'labId' | 'type' | 'title' | 'description' | 'performedBy'> & { metadata?: Record<string, string> }
): void {
  const event: ActivityEvent = {
    id:        `ACT-${uid()}`,
    timestamp: new Date().toISOString(),
    ...fields,
  }
  useActivityStore.getState().addEvent(event)
}

export const ACTIVITY_TYPE_META: Record<ActivityType, { label: string; icon: string; color: string }> = {
  'status-change':          { label: 'Status Changed',         icon: '🔄', color: '#3B82F6' },
  'condition-change':       { label: 'Condition Changed',      icon: '⚠️', color: '#F59E0B' },
  'repair-logged':          { label: 'Repair Logged',          icon: '🔧', color: '#8B5CF6' },
  'password-change':        { label: 'Password Changed',       icon: '🔑', color: '#06B6D4' },
  'ticket-created':         { label: 'Ticket Created',         icon: '📋', color: '#EF4444' },
  'ticket-resolved':        { label: 'Ticket Resolved',        icon: '✅', color: '#10B981' },
  'maintenance-scheduled':  { label: 'Maintenance Scheduled',  icon: '📅', color: '#3B82F6' },
  'maintenance-completed':  { label: 'Maintenance Completed',  icon: '✔️',  color: '#10B981' },
  'part-used':              { label: 'Part Used',              icon: '🔩', color: '#F59E0B' },
  'app-installed':          { label: 'App Installed',          icon: '📦', color: '#10B981' },
  'app-removed':            { label: 'App Removed',            icon: '🗑️', color: '#6B7280' },
}
