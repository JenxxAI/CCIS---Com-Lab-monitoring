import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useThemeStore, useLabStore, useNotifStore } from '@/store'
import { cn } from '@/lib/utils'

export function Topbar() {
  const { dark, sidebarOpen: _sidebarOpen, toggleDark, toggleSidebar } = useThemeStore()
  const { labData } = useLabStore()
  const { notifications, markAllRead } = useNotifStore()

  const allPCs     = Object.values(labData).flat()
  const total      = allPCs.length
  const available  = allPCs.filter(p => p.status === 'available').length
  const occupied   = allPCs.filter(p => p.status === 'occupied').length
  const maintenance= allPCs.filter(p => p.status === 'maintenance').length
  const unread     = notifications.filter(n => !n.read).length

  return (
    <header className={cn(
      'h-14 flex items-center gap-3 px-4 flex-shrink-0',
      'sticky top-0 z-50 border-b',
      dark
        ? 'bg-dark-surface border-dark-border'
        : 'bg-white border-slate-200'
    )}>
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          dark
            ? 'text-slate-400 hover:bg-dark-surfaceAlt'
            : 'text-slate-500 hover:bg-slate-100'
        )}
      >
        <Menu size={17} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className={cn(
          'w-[30px] h-[30px] rounded-lg flex items-center justify-center text-white flex-shrink-0',
        )}
          style={{ background: dark ? '#5b7fff' : '#3a5cf5' }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1"     width="5.5" height="5.5" rx="1.2" fill="white" opacity=".9"/>
            <rect x="7.5" y="1"   width="5.5" height="5.5" rx="1.2" fill="white" opacity=".55"/>
            <rect x="1" y="7.5"   width="5.5" height="5.5" rx="1.2" fill="white" opacity=".55"/>
            <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.2" fill="white" opacity=".9"/>
          </svg>
        </div>
        <div>
          <div className={cn(
            'text-[13px] font-bold leading-tight',
            dark ? 'text-slate-100' : 'text-slate-900'
          )}>
            CICTE Lab Monitor
          </div>
          <div className={cn(
            'text-[10px] leading-none',
            dark ? 'text-slate-600' : 'text-slate-400'
          )}>
            Management System
          </div>
        </div>
      </div>

      {/* Global stats */}
      <div className="ml-auto flex items-center gap-0">
        {[
          { l: 'Total',       v: total,       c: dark ? '#e8ecf4' : '#0f1724' },
          { l: 'Available',   v: available,   c: '#22c55e' },
          { l: 'Occupied',    v: occupied,    c: '#f59e0b' },
          { l: 'Maintenance', v: maintenance, c: '#f43f5e' },
        ].map((s, i) => (
          <div
            key={s.l}
            className={cn(
              'px-3.5 py-1.5 text-center',
              i < 3 && (dark ? 'border-r border-dark-border' : 'border-r border-slate-100')
            )}
          >
            <div className="text-[16px] font-bold leading-tight" style={{ color: s.c }}>
              {s.v}
            </div>
            <div className={cn(
              'text-[9px] tracking-wide mt-px',
              dark ? 'text-slate-600' : 'text-slate-400'
            )}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Live indicator */}
      <div className={cn(
        'flex items-center gap-1.5 px-3 py-1 rounded-full border',
        dark
          ? 'bg-dark-surfaceAlt border-dark-border'
          : 'bg-slate-50 border-slate-200'
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-live-pulse block" />
        <span className={cn('text-[11px] font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>
          Live
        </span>
      </div>

      {/* Notifications bell */}
      <button
        onClick={markAllRead}
        className={cn(
          'relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          dark
            ? 'text-slate-400 hover:bg-dark-surfaceAlt border border-dark-border bg-dark-surfaceAlt'
            : 'text-slate-500 hover:bg-slate-100 border border-slate-200 bg-slate-50'
        )}
      >
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white
            text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dark/Light toggle */}
      <button
        onClick={toggleDark}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors border',
          dark
            ? 'text-slate-400 hover:bg-dark-surfaceAlt border-dark-border bg-dark-surfaceAlt'
            : 'text-slate-500 hover:bg-slate-100 border-slate-200 bg-slate-50'
        )}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </header>
  )
}
