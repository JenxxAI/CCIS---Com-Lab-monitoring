import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PC, ViewTab, StatusFilter, ConditionFilter, Notification, Position, FurnitureItem, PCStatus, PCCondition } from '@/types'
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

// ─── Auth Store (persisted) ───────────────────────────────────────────────────

// Roles (descending access):
//   admin             → Dean / Program Head — total access + user management
//   staff             → Faculty / Technician — same total access as admin
//   student_volunteer → Manage PCs + monitor labs — no user management
//   student           → View only
export type UserRole = 'admin' | 'staff' | 'student_volunteer' | 'student'

export interface AuthUser {
  id:       string
  username: string
  role:     UserRole
  name:     string
}

interface AuthStore {
  token:          string | null
  user:           AuthUser | null
  /** admin or staff — full access including sensitive data & user management */
  isAdmin:        boolean
  /** student_volunteer */
  isVolunteer:    boolean
  /** admin, staff, or student_volunteer — can edit PC status/condition/repairs */
  canManage:      boolean
  /** admin or staff — can manage users */
  canManageUsers: boolean

  login:  (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token:          null,
      user:           null,
      isAdmin:        false,
      isVolunteer:    false,
      canManage:      false,
      canManageUsers: false,

      login: (token, user) => set({
        token,
        user,
        isAdmin:        user.role === 'admin' || user.role === 'staff',
        isVolunteer:    user.role === 'student_volunteer',
        canManage:      user.role !== 'student',
        canManageUsers: user.role === 'admin' || user.role === 'staff',
      }),

      logout: () => set({ token: null, user: null, isAdmin: false, isVolunteer: false, canManage: false, canManageUsers: false }),
    }),
    { name: 'cicte-auth', storage: createJSONStorage(() => sessionStorage) }
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
  isLoading:    boolean

  // Multi-select for batch operations
  selectedPCIds: Set<string>

  setActiveLab:    (id: string)     => void
  setSelectedPC:   (pc: PC | null)  => void
  setActiveView:   (v: ViewTab)     => void
  setStatusFilter: (f: StatusFilter) => void
  setCondFilter:   (f: ConditionFilter) => void
  setSearchQuery:  (q: string)      => void
  updatePC:        (pc: PC)         => void
  setLabPCs:       (labId: string, pcs: PC[]) => void
  loadLabData:     (labId: string)  => Promise<void>

  // Batch selection
  toggleSelectPC:  (pcId: string)   => void
  selectAllPCs:    ()               => void
  clearSelection:  ()               => void
  batchUpdateStatus:    (status: PCStatus)       => void
  batchUpdateCondition: (condition: PCCondition)  => void
}

export const useLabStore = create<LabStore>()((set, get) => ({
  labData:      generateAllLabData(),
  activeLab:    'cl1',
  selectedPC:   null,
  activeView:   'map',
  statusFilter: 'all',
  condFilter:   'all',
  searchQuery:  '',
  isLoading:    false,
  selectedPCIds: new Set<string>(),

  setActiveLab: (id) => {
    set({ activeLab: id, selectedPC: null, selectedPCIds: new Set() })
    get().loadLabData(id)
  },
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
      [updated.labId]: (s.labData[updated.labId] ?? []).map(p =>
        p.id === updated.id ? updated : p
      ),
    },
    selectedPC: s.selectedPC?.id === updated.id ? updated : s.selectedPC,
  })),

  setLabPCs: (labId, pcs) => set(s => ({
    labData: { ...s.labData, [labId]: pcs },
  })),

  loadLabData: async (labId) => {
    try {
      set({ isLoading: true })
      const token = useAuthStore.getState().token
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/labs/${labId}/pcs`, { headers })
      if (res.ok) {
        const pcs: PC[] = await res.json()
        set(s => ({ labData: { ...s.labData, [labId]: pcs }, isLoading: false }))
      } else {
        set({ isLoading: false })
      }
    } catch {
      // API not available — keep using in-memory mock data
      set({ isLoading: false })
    }
  },

  // ── Batch Selection ──────────────────────────────────────────────────
  toggleSelectPC: (pcId) => set(s => {
    const next = new Set(s.selectedPCIds)
    if (next.has(pcId)) next.delete(pcId)
    else next.add(pcId)
    return { selectedPCIds: next }
  }),

  selectAllPCs: () => set(s => {
    const pcs = s.labData[s.activeLab] ?? []
    return { selectedPCIds: new Set(pcs.map(p => p.id)) }
  }),

  clearSelection: () => set({ selectedPCIds: new Set() }),

  batchUpdateStatus: (status) => set(s => {
    const ids = s.selectedPCIds
    const labPcs = s.labData[s.activeLab] ?? []
    return {
      labData: {
        ...s.labData,
        [s.activeLab]: labPcs.map(p => ids.has(p.id) ? { ...p, status } : p),
      },
      selectedPCIds: new Set(),
    }
  }),

  batchUpdateCondition: (condition) => set(s => {
    const ids = s.selectedPCIds
    const labPcs = s.labData[s.activeLab] ?? []
    return {
      labData: {
        ...s.labData,
        [s.activeLab]: labPcs.map(p => ids.has(p.id) ? { ...p, condition } : p),
      },
      selectedPCIds: new Set(),
    }
  }),
}))

// ─── Notifications Store ──────────────────────────────────────────────────────

interface NotifStore {
  notifications: Notification[]
  addNotif:      (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markRead:      (id: string) => void
  markAllRead:   () => void
  removeNotif:   (id: string) => void
  clearAll:      () => void
}

export const useNotifStore = create<NotifStore>()(
  persist(
    (set) => ({
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
        ].slice(0, 100), // keep max 100
      })),
      markRead: (id) => set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),
      markAllRead: () => set(s => ({
        notifications: s.notifications.map(n => ({ ...n, read: true })),
      })),
      removeNotif: (id) => set(s => ({
        notifications: s.notifications.filter(n => n.id !== id),
      })),
      clearAll: () => set({ notifications: [] }),
    }),
    { name: 'cicte-notifications' }
  )
)

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
