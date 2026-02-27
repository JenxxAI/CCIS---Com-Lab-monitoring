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
import { cn } from '@/lib/utils'

// Lazy-loaded views — each in its own chunk
const MapView       = lazy(() => import('@/pages/MapView').then(m => ({ default: m.MapView })))
const ListView      = lazy(() => import('@/pages/ListView').then(m => ({ default: m.ListView })))
const AnalyticsView = lazy(() => import('@/pages/AnalyticsView').then(m => ({ default: m.AnalyticsView })))

// Suspense loading indicator
function ViewLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-30" />
    </div>
  )
}

// Sub-nav tab bar
function SubNav() {
  const { dark } = useThemeStore()
  const { editMode, setEditMode } = useLayoutStore()
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
    { to: '/',          label: 'Lab Map'     },
    { to: '/list',      label: 'PC Registry' },
    { to: '/analytics', label: 'Analytics'   },
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

export default function App() {
  const { dark, sidebarOpen, toggleSidebar } = useThemeStore()
  const { selectedPC } = useLabStore()
  const { user } = useAuthStore()

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Start socket connection
  useSocket()

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
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          {sidebarOpen && <Sidebar />}
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={toggleSidebar}
            />
            {/* Panel */}
            <div className="relative z-10 w-64 max-w-[80vw] h-full animate-fade-in">
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
    </div>
  )
}
