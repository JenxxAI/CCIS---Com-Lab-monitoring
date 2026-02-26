import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PC, ViewTab, StatusFilter, ConditionFilter, Notification, Position, FurnitureItem } from '@/types'
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

// ─── Layout Store (persisted) ─────────────────────────────────────────────────

interface LabLayout {
  pcPositions: Record<string, Position>
  furniture:   FurnitureItem[]
}

interface HistoryEntry {
  pcPositions: Record<string, Position>
  furniture:   FurnitureItem[]
}

const MAX_HISTORY = 40

function snapLayout(l: LabLayout): HistoryEntry {
  return {
    pcPositions: { ...l.pcPositions },
    furniture:   l.furniture.map(f => ({ ...f })),
  }
}

interface LayoutStore {
  layouts:  Record<string, LabLayout>
  editMode: boolean

  // History per lab
  history:     Record<string, HistoryEntry[]>
  historyIdx:  Record<string, number>

  setEditMode:              (v: boolean) => void
  initLayout:               (labId: string, pcPositions: Record<string, Position>, furniture: FurnitureItem[]) => void
  updatePCPosition:         (labId: string, pcId: string, pos: Position) => void
  updateFurniturePosition:  (labId: string, furnitureId: string, pos: Position) => void
  addFurniture:             (labId: string, item: FurnitureItem) => void
  removeFurniture:          (labId: string, furnitureId: string) => void
  resetLayout:              (labId: string) => void

  // Undo / Redo
  pushHistory:              (labId: string) => void
  undo:                     (labId: string) => void
  redo:                     (labId: string) => void
  canUndo:                  (labId: string) => boolean
  canRedo:                  (labId: string) => boolean
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      layouts:    {},
      editMode:   false,
      history:    {},
      historyIdx: {},

      setEditMode: (editMode) => set({ editMode }),

      initLayout: (labId, pcPositions, furniture) => set(s => ({
        layouts: { ...s.layouts, [labId]: { pcPositions, furniture } },
      })),

      updatePCPosition: (labId, pcId, pos) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return {
          layouts: {
            ...s.layouts,
            [labId]: { ...layout, pcPositions: { ...layout.pcPositions, [pcId]: pos } },
          },
        }
      }),

      updateFurniturePosition: (labId, furnitureId, pos) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return {
          layouts: {
            ...s.layouts,
            [labId]: {
              ...layout,
              furniture: layout.furniture.map(f =>
                f.id === furnitureId ? { ...f, x: pos.x, y: pos.y } : f
              ),
            },
          },
        }
      }),

      addFurniture: (labId, item) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return {
          layouts: {
            ...s.layouts,
            [labId]: { ...layout, furniture: [...layout.furniture, item] },
          },
        }
      }),

      removeFurniture: (labId, furnitureId) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return {
          layouts: {
            ...s.layouts,
            [labId]: {
              ...layout,
              furniture: layout.furniture.filter(f => f.id !== furnitureId),
            },
          },
        }
      }),

      resetLayout: (labId) => set(s => {
        const { [labId]: _, ...rest } = s.layouts
        return { layouts: rest }
      }),

      /* ── Undo / Redo ───────────────────────────────────────────────── */
      pushHistory: (labId) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        const arr = s.history[labId] ?? []
        const idx = s.historyIdx[labId] ?? -1
        // Truncate forward history
        const truncated = arr.slice(0, idx + 1)
        const next = [...truncated, snapLayout(layout)].slice(-MAX_HISTORY)
        return {
          history:    { ...s.history, [labId]: next },
          historyIdx: { ...s.historyIdx, [labId]: next.length - 1 },
        }
      }),

      undo: (labId) => set(s => {
        const arr = s.history[labId]
        const idx = s.historyIdx[labId] ?? -1
        if (!arr || idx <= 0) return s
        const prev = arr[idx - 1]
        const layout = s.layouts[labId]
        if (!layout) return s
        return {
          layouts:    { ...s.layouts, [labId]: { ...layout, ...prev } },
          historyIdx: { ...s.historyIdx, [labId]: idx - 1 },
        }
      }),

      redo: (labId) => set(s => {
        const arr = s.history[labId]
        const idx = s.historyIdx[labId] ?? -1
        if (!arr || idx >= arr.length - 1) return s
        const next = arr[idx + 1]
        const layout = s.layouts[labId]
        if (!layout) return s
        return {
          layouts:    { ...s.layouts, [labId]: { ...layout, ...next } },
          historyIdx: { ...s.historyIdx, [labId]: idx + 1 },
        }
      }),

      canUndo: (labId) => {
        const s = get()
        return (s.historyIdx[labId] ?? -1) > 0
      },

      canRedo: (labId) => {
        const s = get()
        const arr = s.history[labId]
        const idx = s.historyIdx[labId] ?? -1
        return !!arr && idx < arr.length - 1
      },
    }),
    {
      name: 'cicte-layouts',
      partialize: (s) => ({ layouts: s.layouts }),   // only persist layouts, not history
    }
  )
)
