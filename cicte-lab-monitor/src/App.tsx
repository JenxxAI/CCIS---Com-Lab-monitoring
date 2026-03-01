import { useEffect, useState, lazy, Suspense, useCallback } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { PCDetailPanel } from '@/components/PCDetailPanel'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ToastContainer } from '@/components/Toast'
import { EditGuardDialog } from '@/components/EditGuardDialog'
import { LoginPage } from '@/pages/LoginPage'
import { useThemeStore, useLabStore, useAuthStore, useLayoutStore } from '@/store'
import { useSocket } from '@/hooks/useSocket'
import { useHeartbeatSimulation } from '@/hooks/useHeartbeat'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMaintenanceReminders } from '@/hooks/useMaintenanceReminders'
import { GlobalSearch } from '@/components/GlobalSearch'
import { cn } from '@/lib/utils'

// Lazy-loaded views — each in its own chunk
const MapView        = lazy(() => import('@/pages/MapView').then(m => ({ default: m.MapView })))
const ListView       = lazy(() => import('@/pages/ListView').then(m => ({ default: m.ListView })))
const AnalyticsView  = lazy(() => import('@/pages/AnalyticsView').then(m => ({ default: m.AnalyticsView })))
const MaintenanceHub = lazy(() => import('@/pages/MaintenanceHub').then(m => ({ default: m.MaintenanceHub })))

// Skeleton shimmer primitive
function Shimmer({ className }: { className?: string }) {
  const { dark } = useThemeStore()
  return (
    <div className={cn(
      'animate-pulse rounded-lg',
      dark ? 'bg-slate-700/40' : 'bg-slate-200/70',
      className
    )} />
  )
}

// Skeletons per view — shown while lazy chunks load
function MapSkeleton() {
  return (
    <div className="p-4 sm:p-6 h-full flex flex-col gap-4">
      <div className="flex gap-2">
        <Shimmer className="h-7 w-28" />
        <Shimmer className="h-7 w-20" />
        <Shimmer className="h-7 w-24" />
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 flex-1">
        {Array.from({ length: 30 }).map((_, i) => <Shimmer key={i} className="aspect-square" />)}
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="p-4 sm:p-6 flex flex-col gap-3">
      <div className="flex gap-2 mb-2">
        <Shimmer className="h-8 w-44" />
        <Shimmer className="h-8 w-20" />
        <Shimmer className="h-8 w-20" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => <Shimmer key={i} className="h-10 w-full" />)}
    </div>
  )
}

function GenericSkeleton() {
  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <Shimmer className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Shimmer key={i} className="h-24" />)}
      </div>
      <Shimmer className="h-48 w-full" />
      <Shimmer className="h-48 w-full" />
    </div>
  )
}

// Route-aware skeleton — matches the shape of each view
function ViewLoader() {
  const path = window.location.pathname
  if (path === '/') return <MapSkeleton />
  if (path === '/list') return <ListSkeleton />
  return <GenericSkeleton />
}

// Sub-nav tab bar
function SubNav() {
  const { dark } = useThemeStore()
  const { editMode, setEditMode } = useLayoutStore()
  const user = useAuthStore(s => s.user)
  const isStudent = user?.role === 'student'
  const navigate = useNavigate()
  const location = useLocation()
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const [pendingTab, setPendingTab] = useState<string | null>(null)

  const handleTabClick = useCallback((e: React.MouseEvent, to: string) => {
    if (location.pathname === to) return
    if (editMode) {
      e.preventDefault()
      setPendingTab(to)
    }
  }, [editMode, location.pathname])

  const tabs = [
    { to: '/',            label: 'Lab Map'     },
    { to: '/list',        label: 'PC Registry' },
    ...(!isStudent ? [
      { to: '/analytics',   label: 'Analytics'   },
      { to: '/maintenance', label: 'Maintenance' },
    ] : []),
  ]

  return (
    <>
      <div className={cn(
        'h-11 flex items-center gap-1 px-2 sm:px-4 flex-shrink-0 border-b overflow-x-auto',
        dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
      )}>
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            onClick={(e) => handleTabClick(e, tab.to)}
            className="h-full px-3 sm:px-4 text-[12px] transition-all duration-150 whitespace-nowrap flex items-center"
            style={({ isActive }) => ({
              fontWeight: isActive ? 600 : 400,
              color:      isActive ? accent : (dark ? '#7b87a2' : '#6b7590'),
              borderBottom: `2px solid ${isActive ? accent : 'transparent'}`,
              textDecoration: 'none',
            })}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <EditGuardDialog
        open={!!pendingTab}
        message="Switching views will discard any unsaved layout changes. Finish editing first, or discard to continue."
        confirmLabel="Discard & Switch"
        onCancel={() => setPendingTab(null)}
        onConfirm={() => {
          if (!pendingTab) return
          setEditMode(false)
          navigate(pendingTab)
          setPendingTab(null)
        }}
      />
    </>
  )
}

export function AppShell() {
  const { dark, sidebarOpen, toggleSidebar } = useThemeStore()
  const { selectedPC } = useLabStore()
  const { user } = useAuthStore()

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Start socket connection and heartbeat simulation
  useSocket()
  useHeartbeatSimulation()
  useKeyboardShortcuts()
  useMaintenanceReminders()

  // Global search modal state
  const [searchOpen, setSearchOpen] = useState(false)
  useEffect(() => {
    const handler = () => setSearchOpen(true)
    window.addEventListener('cicte:global-search', handler)
    return () => window.removeEventListener('cicte:global-search', handler)
  }, [])

  // Auth gate — show login if not authenticated
  if (!user) {
    return <LoginPage />
  }

  return (
    <div className={cn(
      'flex flex-col h-screen overflow-hidden font-sans',
      dark ? 'bg-dark-bg text-slate-200' : 'bg-slate-50 text-slate-900'
    )}>
      <Topbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar — smooth slide */}
        <div
          className={cn(
            'hidden md:flex flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out',
            sidebarOpen ? 'w-52' : 'w-0'
          )}
        >
          <Sidebar />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={toggleSidebar}
            />
            {/* Panel — slides in from left */}
            <div className="relative z-10 w-64 max-w-[80vw] h-full animate-slide-in">
              <Sidebar />
            </div>
          </div>
        )}

        <main className="flex flex-col flex-1 overflow-hidden min-w-0">
          <SubNav />

          <div className="flex flex-1 overflow-hidden relative">
            {/* Scrollable content */}
            <div className="flex-1 overflow-auto">
              <ErrorBoundary>
                <Suspense fallback={<ViewLoader />}>
                  <Routes>
                    <Route path="/" element={<MapView />} />
                    <Route path="/list" element={<ListView />} />
                    <Route path="/analytics" element={<AnalyticsView />} />
                    <Route path="/maintenance" element={<MaintenanceHub />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* PC Detail Panel — desktop: side panel, mobile: bottom sheet */}
            <div className="hidden md:block h-full overflow-hidden">
              <PCDetailPanel />
            </div>
            {selectedPC && (
              <div className="md:hidden fixed inset-0 z-[55] flex flex-col justify-end">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => useLabStore.getState().setSelectedPC(null)}
                />
                <div className="relative z-10 max-h-[75vh] overflow-y-auto rounded-t-2xl animate-fade-in">
                  <PCDetailPanel />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <ToastContainer />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
