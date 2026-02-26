import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PC, ViewTab, StatusFilter, ConditionFilter, Notification } from '@/types'
import { generateAllLabData } from '@/lib/data'

// ─── UI / Theme Store ─────────────────────────────────────────────────────────

interface ThemeStore {
  dark:       boolean
  sidebarOpen: boolean
  toggleDark:    () => void
  toggleSidebar: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      dark:        true,
      sidebarOpen: true,
      toggleDark:    () => set(s => ({ dark: !s.dark })),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'cicte-theme' }
  )
)

// ─── Lab / PC Store ───────────────────────────────────────────────────────────

interface LabStore {
  labData:      Record<string, PC[]>
  activeLab:    string
  selectedPC:   PC | null
  activeView:   ViewTab
  statusFilter: StatusFilter
  condFilter:   ConditionFilter
  searchQuery:  string

  setActiveLab:    (id: string)     => void
  setSelectedPC:   (pc: PC | null)  => void
  setActiveView:   (v: ViewTab)     => void
  setStatusFilter: (f: StatusFilter) => void
  setCondFilter:   (f: ConditionFilter) => void
  setSearchQuery:  (q: string)      => void
  updatePC:        (pc: PC)         => void
}

export const useLabStore = create<LabStore>()((set) => ({
  labData:      generateAllLabData(),
  activeLab:    'cl1',
  selectedPC:   null,
  activeView:   'map',
  statusFilter: 'all',
  condFilter:   'all',
  searchQuery:  '',

  setActiveLab: (id) => set({ activeLab: id, selectedPC: null }),
  setSelectedPC: (pc) => set(s => ({
    selectedPC: s.selectedPC?.id === pc?.id ? null : pc,
  })),
  setActiveView:   (activeView) => set({ activeView }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setCondFilter:   (condFilter) => set({ condFilter }),
  setSearchQuery:  (searchQuery) => set({ searchQuery }),

  updatePC: (updated) => set(s => ({
    labData: {
      ...s.labData,
      [updated.labId]: s.labData[updated.labId].map(p =>
        p.id === updated.id ? updated : p
      ),
    },
    selectedPC: s.selectedPC?.id === updated.id ? updated : s.selectedPC,
  })),
}))

// ─── Notifications Store ──────────────────────────────────────────────────────

interface NotifStore {
  notifications: Notification[]
  addNotif:      (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAllRead:   () => void
  clearAll:      () => void
}

export const useNotifStore = create<NotifStore>()((set) => ({
  notifications: [],
  addNotif: (n) => set(s => ({
    notifications: [
      {
        ...n,
        id:        Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        read:      false,
      },
      ...s.notifications,
    ].slice(0, 50), // keep max 50
  })),
  markAllRead: () => set(s => ({
    notifications: s.notifications.map(n => ({ ...n, read: true })),
  })),
  clearAll: () => set({ notifications: [] }),
}))
