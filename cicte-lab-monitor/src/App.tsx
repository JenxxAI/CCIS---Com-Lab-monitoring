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
      'h-11 flex items-center gap-1 px-4 flex-shrink-0 border-b',
      dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
    )}>
      {tabs.map(tab => {
        const active = activeView === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className="h-full px-4 text-[12px] transition-all duration-150"
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
  const { dark, sidebarOpen } = useThemeStore()
  const { activeView } = useLabStore()

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

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <Sidebar />}

        <main className="flex flex-col flex-1 overflow-hidden min-w-0">
          <SubNav />

          <div className="flex flex-1 overflow-hidden">
            {/* Scrollable content */}
            <div className="flex-1 overflow-auto">
              {activeView === 'map'       && <MapView />}
              {activeView === 'list'      && <ListView />}
              {activeView === 'analytics' && <AnalyticsView />}
            </div>

            {/* PC Detail Panel (slide from right) */}
            <PCDetailPanel />
          </div>
        </main>
      </div>
    </div>
  )
}
