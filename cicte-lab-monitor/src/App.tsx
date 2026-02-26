import { useEffect } from 'react'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import { PCDetailPanel } from '@/components/PCDetailPanel'
import { MapView } from '@/pages/MapView'
import { ListView } from '@/pages/ListView'
import { AnalyticsView } from '@/pages/AnalyticsView'
import { useThemeStore, useLabStore } from '@/store'
import { useSocket } from '@/hooks/useSocket'
import { cn } from '@/lib/utils'

// Sub-nav tab bar
function SubNav() {
  const { dark } = useThemeStore()
  const { activeView, setActiveView } = useLabStore()
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const tabs = [
    { id: 'map'       as const, label: 'Lab Map'     },
    { id: 'list'      as const, label: 'PC Registry' },
    { id: 'analytics' as const, label: 'Analytics'   },
  ]

  return (
    <div className={cn(
      'h-11 flex items-center gap-1 px-2 sm:px-4 flex-shrink-0 border-b overflow-x-auto',
      dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
    )}>
      {tabs.map(tab => {
        const active = activeView === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className="h-full px-3 sm:px-4 text-[12px] transition-all duration-150 whitespace-nowrap"
            style={{
              fontWeight: active ? 600 : 400,
              color:      active ? accent : (dark ? '#7b87a2' : '#6b7590'),
              borderBottom: `2px solid ${active ? accent : 'transparent'}`,
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  const { dark, sidebarOpen, toggleSidebar } = useThemeStore()
  const { activeView, selectedPC } = useLabStore()

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Start socket connection
  useSocket()

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
              {activeView === 'map'       && <MapView />}
              {activeView === 'list'      && <ListView />}
              {activeView === 'analytics' && <AnalyticsView />}
            </div>

            {/* PC Detail Panel — desktop: side panel, mobile: bottom sheet */}
            <div className="hidden md:block">
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
    </div>
  )
}
