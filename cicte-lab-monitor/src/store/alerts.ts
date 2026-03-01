import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AlertRule, AlertCondition } from '@/types'

// ─── Alert Condition Metadata ────────────────────────────────────────────────

export const ALERT_CONDITION_META: Record<AlertCondition, { label: string; icon: string; color: string; defaultMin: number }> = {
  'pc-offline':            { label: 'PC Offline',             icon: '📡', color: '#f43f5e', defaultMin: 10 },
  'status-maintenance':    { label: 'Status → Maintenance',  icon: '🔧', color: '#f59e0b', defaultMin: 0 },
  'condition-damaged':     { label: 'Condition → Damaged',    icon: '💥', color: '#ef4444', defaultMin: 0 },
  'condition-needs-repair':{ label: 'Condition → Needs Repair', icon: '⚠️', color: '#f97316', defaultMin: 0 },
  'low-stock':             { label: 'Spare Part Low Stock',   icon: '📦', color: '#8b5cf6', defaultMin: 0 },
  'ticket-unresolved':     { label: 'Ticket Unresolved',      icon: '🎫', color: '#ec4899', defaultMin: 60 },
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface AlertStore {
  rules:       AlertRule[]
  addRule:     (r: Omit<AlertRule, 'id' | 'createdAt'>) => void
  updateRule:  (id: string, patch: Partial<AlertRule>) => void
  removeRule:  (id: string) => void
  toggleRule:  (id: string) => void
  setRules:    (rules: AlertRule[]) => void
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set) => ({
      rules: defaultRules(),

      addRule: (r) => set(s => ({
        rules: [
          { ...r, id: `AR-${Math.random().toString(36).slice(2, 9)}`, createdAt: new Date().toISOString() },
          ...s.rules,
        ],
      })),

      updateRule: (id, patch) => set(s => ({
        rules: s.rules.map(r => r.id === id ? { ...r, ...patch } : r),
      })),

      removeRule: (id) => set(s => ({
        rules: s.rules.filter(r => r.id !== id),
      })),

      toggleRule: (id) => set(s => ({
        rules: s.rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r),
      })),

      setRules: (rules) => set({ rules }),
    }),
    { name: 'cicte-alert-rules' }
  )
)

// ─── Default rules shipped with the app ──────────────────────────────────────

function defaultRules(): AlertRule[] {
  const now = new Date().toISOString()
  return [
    { id: 'AR-default-1', name: 'PC offline > 10 min',        condition: 'pc-offline',             thresholdMin: 10,  enabled: true, createdAt: now },
    { id: 'AR-default-2', name: 'PC flagged for maintenance',  condition: 'status-maintenance',     thresholdMin: 0,   enabled: true, createdAt: now },
    { id: 'AR-default-3', name: 'PC damage detected',          condition: 'condition-damaged',      thresholdMin: 0,   enabled: true, createdAt: now },
    { id: 'AR-default-4', name: 'Spare part low stock',        condition: 'low-stock',              thresholdMin: 0,   enabled: false, createdAt: now },
    { id: 'AR-default-5', name: 'Ticket unresolved > 2 hours', condition: 'ticket-unresolved',      thresholdMin: 120, enabled: false, createdAt: now },
  ]
}
