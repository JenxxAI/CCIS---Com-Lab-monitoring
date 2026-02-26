import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PC, ViewTab, StatusFilter, ConditionFilter, Notification, Position, FurnitureItem, ItemGroup, ItemRef } from '@/types'
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
  pcPositions:  Record<string, Position>
  pcLocked:     Record<string, boolean>
  pcGroups:     Record<string, string>        // pcId → groupId
  furniture:    FurnitureItem[]
  groups:       ItemGroup[]
}

interface HistoryEntry {
  pcPositions: Record<string, Position>
  pcLocked:    Record<string, boolean>
  pcGroups:    Record<string, string>
  furniture:   FurnitureItem[]
  groups:      ItemGroup[]
}

const MAX_HISTORY = 40
const GROUP_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316']

interface LayoutStore {
  layouts:    Record<string, LabLayout>
  editMode:   boolean
  selection:  ItemRef[]               // multi-select

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

  // Selection
  setSelection:             (sel: ItemRef[]) => void
  toggleSelection:          (ref: ItemRef) => void
  clearSelection:           () => void

  // Lock
  toggleLockPC:             (labId: string, pcId: string) => void
  toggleLockFurniture:      (labId: string, furnitureId: string) => void
  lockSelection:            (labId: string) => void
  unlockSelection:          (labId: string) => void

  // Group
  groupSelection:           (labId: string) => void
  ungroupSelection:         (labId: string) => void
  getGroupMembers:          (labId: string, groupId: string) => ItemRef[]

  // Duplicate
  duplicateSelection:       (labId: string, pcs: PC[]) => void

  // Rename
  renameFurniture:          (labId: string, furnitureId: string, label: string) => void

  // Multi-move (for group drag)
  moveMultiple:             (labId: string, moves: Array<{ ref: ItemRef; pos: Position }>) => void

  // Undo / Redo
  pushHistory:              (labId: string) => void
  undo:                     (labId: string) => void
  redo:                     (labId: string) => void
  canUndo:                  (labId: string) => boolean
  canRedo:                  (labId: string) => boolean
}

function emptyLayout(): LabLayout {
  return { pcPositions: {}, pcLocked: {}, pcGroups: {}, furniture: [], groups: [] }
}

function snapLayout(l: LabLayout): HistoryEntry {
  return {
    pcPositions: { ...l.pcPositions },
    pcLocked:    { ...l.pcLocked },
    pcGroups:    { ...l.pcGroups },
    furniture:   l.furniture.map(f => ({ ...f })),
    groups:      l.groups.map(g => ({ ...g })),
  }
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      layouts:    {},
      editMode:   false,
      selection:  [],
      history:    {},
      historyIdx: {},

      setEditMode: (editMode) => set({ editMode, selection: [] }),

      initLayout: (labId, pcPositions, furniture) => set(s => ({
        layouts: { ...s.layouts, [labId]: { pcPositions, pcLocked: {}, pcGroups: {}, furniture, groups: [] } },
      })),

      updatePCPosition: (labId, pcId, pos) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcPositions: { ...layout.pcPositions, [pcId]: pos } } } }
      }),

      updateFurniturePosition: (labId, furnitureId, pos) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return { layouts: { ...s.layouts, [labId]: { ...layout, furniture: layout.furniture.map(f => f.id === furnitureId ? { ...f, x: pos.x, y: pos.y } : f) } } }
      }),

      addFurniture: (labId, item) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return { layouts: { ...s.layouts, [labId]: { ...layout, furniture: [...layout.furniture, item] } } }
      }),

      removeFurniture: (labId, furnitureId) => set(s => {
        const layout = s.layouts[labId]
        if (!layout) return s
        return { layouts: { ...s.layouts, [labId]: { ...layout, furniture: layout.furniture.filter(f => f.id !== furnitureId) } } }
      }),

      resetLayout: (labId) => set(s => {
        const { [labId]: _, ...rest } = s.layouts
        return { layouts: rest, selection: [] }
      }),

      /* ── Selection ─────────────────────────────────────────────────── */
      setSelection: (selection) => set({ selection }),
      toggleSelection: (ref) => set(s => {
        const idx = s.selection.findIndex(r => r.id === ref.id && r.kind === ref.kind)
        return { selection: idx >= 0 ? s.selection.filter((_, i) => i !== idx) : [...s.selection, ref] }
      }),
      clearSelection: () => set({ selection: [] }),

      /* ── Lock ──────────────────────────────────────────────────────── */
      toggleLockPC: (labId, pcId) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        const locked = { ...layout.pcLocked, [pcId]: !layout.pcLocked[pcId] }
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcLocked: locked } } }
      }),

      toggleLockFurniture: (labId, furnitureId) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        return { layouts: { ...s.layouts, [labId]: { ...layout, furniture: layout.furniture.map(f => f.id === furnitureId ? { ...f, locked: !f.locked } : f) } } }
      }),

      lockSelection: (labId) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        const pcLocked = { ...layout.pcLocked }
        const furniture = layout.furniture.map(f => ({ ...f }))
        for (const ref of s.selection) {
          if (ref.kind === 'pc') pcLocked[ref.id] = true
          else {
            const fi = furniture.findIndex(f => f.id === ref.id)
            if (fi >= 0) furniture[fi] = { ...furniture[fi], locked: true }
          }
        }
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcLocked, furniture } } }
      }),

      unlockSelection: (labId) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        const pcLocked = { ...layout.pcLocked }
        const furniture = layout.furniture.map(f => ({ ...f }))
        for (const ref of s.selection) {
          if (ref.kind === 'pc') delete pcLocked[ref.id]
          else {
            const fi = furniture.findIndex(f => f.id === ref.id)
            if (fi >= 0) furniture[fi] = { ...furniture[fi], locked: false }
          }
        }
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcLocked, furniture } } }
      }),

      /* ── Group ─────────────────────────────────────────────────────── */
      groupSelection: (labId) => set(s => {
        if (s.selection.length < 2) return s
        const layout = s.layouts[labId] ?? emptyLayout()
        const groupId = `grp-${Date.now()}`
        const color = GROUP_COLORS[layout.groups.length % GROUP_COLORS.length]
        const group: ItemGroup = { id: groupId, label: `Group ${layout.groups.length + 1}`, color }
        const pcGroups = { ...layout.pcGroups }
        const furniture = layout.furniture.map(f => ({ ...f }))
        for (const ref of s.selection) {
          if (ref.kind === 'pc') pcGroups[ref.id] = groupId
          else {
            const fi = furniture.findIndex(f => f.id === ref.id)
            if (fi >= 0) furniture[fi] = { ...furniture[fi], groupId }
          }
        }
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcGroups, furniture, groups: [...layout.groups, group] } } }
      }),

      ungroupSelection: (labId) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        const pcGroups = { ...layout.pcGroups }
        const furniture = layout.furniture.map(f => ({ ...f }))
        const removedGroupIds = new Set<string>()
        for (const ref of s.selection) {
          if (ref.kind === 'pc' && pcGroups[ref.id]) {
            removedGroupIds.add(pcGroups[ref.id])
            delete pcGroups[ref.id]
          } else {
            const fi = furniture.findIndex(f => f.id === ref.id)
            if (fi >= 0 && furniture[fi].groupId) {
              removedGroupIds.add(furniture[fi].groupId!)
              furniture[fi] = { ...furniture[fi], groupId: undefined }
            }
          }
        }
        // Remove groups that have no remaining members
        const groups = layout.groups.filter(g => {
          if (!removedGroupIds.has(g.id)) return true
          const hasPcMember = Object.values(pcGroups).includes(g.id)
          const hasFurnMember = furniture.some(f => f.groupId === g.id)
          return hasPcMember || hasFurnMember
        })
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcGroups, furniture, groups } } }
      }),

      getGroupMembers: (labId, groupId) => {
        const layout = get().layouts[labId]
        if (!layout) return []
        const members: ItemRef[] = []
        for (const [pcId, gId] of Object.entries(layout.pcGroups)) {
          if (gId === groupId) members.push({ id: pcId, kind: 'pc' })
        }
        for (const f of layout.furniture) {
          if (f.groupId === groupId) members.push({ id: f.id, kind: 'furniture' })
        }
        return members
      },

      /* ── Duplicate ─────────────────────────────────────────────────── */
      duplicateSelection: (labId, _pcs) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        const pcPositions = { ...layout.pcPositions }
        const furniture = [...layout.furniture]
        const newSelection: ItemRef[] = []
        const offset = 20

        for (const ref of s.selection) {
          if (ref.kind === 'furniture') {
            const orig = furniture.find(f => f.id === ref.id)
            if (!orig) continue
            const dup: FurnitureItem = { ...orig, id: `${orig.id}-dup-${Date.now()}`, x: orig.x + offset, y: orig.y + offset, locked: false, groupId: undefined }
            furniture.push(dup)
            newSelection.push({ id: dup.id, kind: 'furniture' })
          }
          // Skip PC duplication (can't duplicate PCs)
        }
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcPositions, furniture } }, selection: newSelection }
      }),

      /* ── Rename ────────────────────────────────────────────────────── */
      renameFurniture: (labId, furnitureId, label) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        return { layouts: { ...s.layouts, [labId]: { ...layout, furniture: layout.furniture.map(f => f.id === furnitureId ? { ...f, label } : f) } } }
      }),

      /* ── Multi-move ────────────────────────────────────────────────── */
      moveMultiple: (labId, moves) => set(s => {
        const layout = s.layouts[labId] ?? emptyLayout()
        const pcPositions = { ...layout.pcPositions }
        const furniture = layout.furniture.map(f => ({ ...f }))
        for (const m of moves) {
          if (m.ref.kind === 'pc') {
            pcPositions[m.ref.id] = m.pos
          } else {
            const fi = furniture.findIndex(f => f.id === m.ref.id)
            if (fi >= 0) furniture[fi] = { ...furniture[fi], x: m.pos.x, y: m.pos.y }
          }
        }
        return { layouts: { ...s.layouts, [labId]: { ...layout, pcPositions, furniture } } }
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
        return { history: { ...s.history, [labId]: next }, historyIdx: { ...s.historyIdx, [labId]: next.length - 1 } }
      }),

      undo: (labId) => set(s => {
        const arr = s.history[labId]
        const idx = s.historyIdx[labId] ?? -1
        if (!arr || idx <= 0) return s
        const prev = arr[idx - 1]
        const layout = s.layouts[labId] ?? emptyLayout()
        return {
          layouts: { ...s.layouts, [labId]: { ...layout, ...prev } },
          historyIdx: { ...s.historyIdx, [labId]: idx - 1 },
        }
      }),

      redo: (labId) => set(s => {
        const arr = s.history[labId]
        const idx = s.historyIdx[labId] ?? -1
        if (!arr || idx >= arr.length - 1) return s
        const next = arr[idx + 1]
        const layout = s.layouts[labId] ?? emptyLayout()
        return {
          layouts: { ...s.layouts, [labId]: { ...layout, ...next } },
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
      partialize: (s) => ({ layouts: s.layouts }),   // only persist layouts, not selection/history
    }
  )
)
