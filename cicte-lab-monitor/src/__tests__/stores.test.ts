import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore, useAuthStore, useLabStore, useNotifStore, useLayoutStore } from '@/store'
import type { PC, Position, FurnitureItem } from '@/types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reset all stores between tests to avoid leakage */
function resetStores() {
  useThemeStore.setState({ dark: true, sidebarOpen: true })
  useAuthStore.setState({ token: null, user: null, isAdmin: false })
  useNotifStore.setState({ notifications: [] })
  useLayoutStore.setState({ layouts: {}, editMode: false, history: {}, historyIdx: {} })
}

/** Minimal test PC */
function makePC(overrides: Partial<PC> = {}): PC {
  return {
    id: 'pc-1',
    num: 1,
    labId: 'cl1',
    status: 'available',
    condition: 'good',
    password: 'pass',
    lastPasswordChange: '2024-01-01',
    lastPasswordChangedBy: 'admin',
    lastStudent: 'Alice',
    lastUsed: '2024-06-01T09:00:00Z',
    routerSSID: 'Lab-Wifi',
    routerPassword: 'wifi123',
    specs: {
      ram: '16 GB',
      storage: '512 GB SSD',
      os: 'Windows 11',
      cpu: 'Core i5',
      software: ['Chrome', 'VS Code'],
      pcType: 'Desktop',
    },
    repairs: [],
    ...overrides,
  }
}

// ─── ThemeStore ──────────────────────────────────────────────────────────────

describe('ThemeStore', () => {
  beforeEach(resetStores)

  it('defaults to dark mode and sidebar open', () => {
    const s = useThemeStore.getState()
    expect(s.dark).toBe(true)
    expect(s.sidebarOpen).toBe(true)
  })

  it('toggleDark toggles the dark flag', () => {
    useThemeStore.getState().toggleDark()
    expect(useThemeStore.getState().dark).toBe(false)
    useThemeStore.getState().toggleDark()
    expect(useThemeStore.getState().dark).toBe(true)
  })

  it('toggleSidebar toggles the sidebarOpen flag', () => {
    useThemeStore.getState().toggleSidebar()
    expect(useThemeStore.getState().sidebarOpen).toBe(false)
  })
})

// ─── AuthStore ───────────────────────────────────────────────────────────────

describe('AuthStore', () => {
  beforeEach(resetStores)

  it('starts logged out', () => {
    const s = useAuthStore.getState()
    expect(s.token).toBeNull()
    expect(s.user).toBeNull()
    expect(s.isAdmin).toBe(false)
  })

  it('login sets token, user, and computes isAdmin for admin role', () => {
    useAuthStore.getState().login('tok-1', {
      id: 'u1', username: 'admin', role: 'admin', name: 'Admin',
    })
    const s = useAuthStore.getState()
    expect(s.token).toBe('tok-1')
    expect(s.user?.username).toBe('admin')
    expect(s.isAdmin).toBe(true)
  })

  it('login sets isAdmin false for viewer role', () => {
    useAuthStore.getState().login('tok-2', {
      id: 'u2', username: 'viewer', role: 'viewer', name: 'Viewer',
    })
    expect(useAuthStore.getState().isAdmin).toBe(false)
  })

  it('logout clears everything', () => {
    useAuthStore.getState().login('tok-1', {
      id: 'u1', username: 'admin', role: 'admin', name: 'Admin',
    })
    useAuthStore.getState().logout()
    const s = useAuthStore.getState()
    expect(s.token).toBeNull()
    expect(s.user).toBeNull()
    expect(s.isAdmin).toBe(false)
  })
})

// ─── LabStore ────────────────────────────────────────────────────────────────

describe('LabStore', () => {
  beforeEach(resetStores)

  it('has seed data for default lab "cl1"', () => {
    const data = useLabStore.getState().labData
    expect(data).toHaveProperty('cl1')
    expect(data.cl1.length).toBeGreaterThan(0)
  })

  it('setSelectedPC selects and toggles', () => {
    const pc = makePC()
    useLabStore.getState().setSelectedPC(pc)
    expect(useLabStore.getState().selectedPC?.id).toBe('pc-1')

    // Toggle off when same PC is selected again
    useLabStore.getState().setSelectedPC(pc)
    expect(useLabStore.getState().selectedPC).toBeNull()
  })

  it('setStatusFilter updates the filter', () => {
    useLabStore.getState().setStatusFilter('maintenance')
    expect(useLabStore.getState().statusFilter).toBe('maintenance')
  })

  it('setCondFilter updates the condition filter', () => {
    useLabStore.getState().setCondFilter('damaged')
    expect(useLabStore.getState().condFilter).toBe('damaged')
  })

  it('setSearchQuery updates the search string', () => {
    useLabStore.getState().setSearchQuery('PC-03')
    expect(useLabStore.getState().searchQuery).toBe('PC-03')
  })

  it('updatePC replaces a PC in the correct lab', () => {
    const pcs = useLabStore.getState().labData.cl1
    const original = pcs[0]
    const updated = { ...original, status: 'maintenance' as const }
    useLabStore.getState().updatePC(updated)

    const after = useLabStore.getState().labData.cl1
    const found = after.find(p => p.id === original.id)
    expect(found?.status).toBe('maintenance')
  })

  it('setLabPCs overwrites PCs for a lab', () => {
    const newPCs = [makePC({ id: 'x1', num: 99 })]
    useLabStore.getState().setLabPCs('cl1', newPCs)
    expect(useLabStore.getState().labData.cl1).toHaveLength(1)
    expect(useLabStore.getState().labData.cl1[0].num).toBe(99)
  })
})

// ─── NotifStore ──────────────────────────────────────────────────────────────

describe('NotifStore', () => {
  beforeEach(resetStores)

  it('starts empty', () => {
    expect(useNotifStore.getState().notifications).toHaveLength(0)
  })

  it('addNotif adds a notification with auto-generated fields', () => {
    useNotifStore.getState().addNotif({
      level: 'info',
      message: 'Test notification',
    })
    const notifs = useNotifStore.getState().notifications
    expect(notifs).toHaveLength(1)
    expect(notifs[0].message).toBe('Test notification')
    expect(notifs[0].read).toBe(false)
    expect(notifs[0].id).toBeTruthy()
    expect(notifs[0].timestamp).toBeTruthy()
  })

  it('notifications are prepended (newest first)', () => {
    useNotifStore.getState().addNotif({ level: 'info', message: 'First' })
    useNotifStore.getState().addNotif({ level: 'warning', message: 'Second' })
    const notifs = useNotifStore.getState().notifications
    expect(notifs[0].message).toBe('Second')
    expect(notifs[1].message).toBe('First')
  })

  it('caps at 50 notifications', () => {
    for (let i = 0; i < 60; i++) {
      useNotifStore.getState().addNotif({ level: 'info', message: `n-${i}` })
    }
    expect(useNotifStore.getState().notifications).toHaveLength(50)
  })

  it('markAllRead marks every notification as read', () => {
    useNotifStore.getState().addNotif({ level: 'info', message: 'a' })
    useNotifStore.getState().addNotif({ level: 'error', message: 'b' })
    useNotifStore.getState().markAllRead()
    const notifs = useNotifStore.getState().notifications
    expect(notifs.every(n => n.read)).toBe(true)
  })

  it('clearAll removes all notifications', () => {
    useNotifStore.getState().addNotif({ level: 'info', message: 'a' })
    useNotifStore.getState().clearAll()
    expect(useNotifStore.getState().notifications).toHaveLength(0)
  })
})

// ─── LayoutStore ─────────────────────────────────────────────────────────────

describe('LayoutStore', () => {
  beforeEach(resetStores)

  const positions: Record<string, Position> = {
    'pc-1': { x: 10, y: 20 },
    'pc-2': { x: 50, y: 60 },
  }

  const furniture: FurnitureItem[] = [
    { id: 'f1', type: 'table', x: 100, y: 200, label: 'Desk', width: 80, height: 40 },
  ]

  it('initLayout stores positions and furniture', () => {
    useLayoutStore.getState().initLayout('cl1', positions, furniture)
    const layout = useLayoutStore.getState().layouts.cl1
    expect(layout).toBeDefined()
    expect(layout.pcPositions['pc-1']).toEqual({ x: 10, y: 20 })
    expect(layout.furniture).toHaveLength(1)
  })

  it('updatePCPosition moves a PC', () => {
    useLayoutStore.getState().initLayout('cl1', positions, furniture)
    useLayoutStore.getState().updatePCPosition('cl1', 'pc-1', { x: 99, y: 88 })
    expect(useLayoutStore.getState().layouts.cl1.pcPositions['pc-1']).toEqual({ x: 99, y: 88 })
  })

  it('updateFurniturePosition moves furniture', () => {
    useLayoutStore.getState().initLayout('cl1', positions, furniture)
    useLayoutStore.getState().updateFurniturePosition('cl1', 'f1', { x: 300, y: 400 })
    const f = useLayoutStore.getState().layouts.cl1.furniture[0]
    expect(f.x).toBe(300)
    expect(f.y).toBe(400)
  })

  it('addFurniture appends an item', () => {
    useLayoutStore.getState().initLayout('cl1', positions, furniture)
    useLayoutStore.getState().addFurniture('cl1', {
      id: 'f2', type: 'door', x: 0, y: 0, label: 'Door', width: 30, height: 10,
    })
    expect(useLayoutStore.getState().layouts.cl1.furniture).toHaveLength(2)
  })

  it('removeFurniture removes by id', () => {
    useLayoutStore.getState().initLayout('cl1', positions, furniture)
    useLayoutStore.getState().removeFurniture('cl1', 'f1')
    expect(useLayoutStore.getState().layouts.cl1.furniture).toHaveLength(0)
  })

  it('resetLayout deletes a lab layout', () => {
    useLayoutStore.getState().initLayout('cl1', positions, furniture)
    useLayoutStore.getState().resetLayout('cl1')
    expect(useLayoutStore.getState().layouts).not.toHaveProperty('cl1')
  })

  it('setEditMode toggles edit mode', () => {
    useLayoutStore.getState().setEditMode(true)
    expect(useLayoutStore.getState().editMode).toBe(true)
    useLayoutStore.getState().setEditMode(false)
    expect(useLayoutStore.getState().editMode).toBe(false)
  })

  it('undo / redo cycle works', () => {
    const store = useLayoutStore.getState()
    store.initLayout('cl1', positions, furniture)
    store.pushHistory('cl1')

    // Move PC, push again
    useLayoutStore.getState().updatePCPosition('cl1', 'pc-1', { x: 999, y: 888 })
    useLayoutStore.getState().pushHistory('cl1')

    expect(useLayoutStore.getState().canUndo('cl1')).toBe(true)

    // Undo should revert to original position
    useLayoutStore.getState().undo('cl1')
    expect(useLayoutStore.getState().layouts.cl1.pcPositions['pc-1']).toEqual({ x: 10, y: 20 })

    // Redo should go back to new position
    expect(useLayoutStore.getState().canRedo('cl1')).toBe(true)
    useLayoutStore.getState().redo('cl1')
    expect(useLayoutStore.getState().layouts.cl1.pcPositions['pc-1']).toEqual({ x: 999, y: 888 })
  })
})
