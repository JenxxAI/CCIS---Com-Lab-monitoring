import { useState, useRef, useEffect } from 'react'
import { Menu, Sun, Moon, Bell, LogOut, Check, Trash2 } from 'lucide-react'
import { useThemeStore, useLabStore, useNotifStore, useAuthStore, useLayoutStore } from '@/store'
import { cn } from '@/lib/utils'
import { EditGuardDialog } from './EditGuardDialog'

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function Topbar() {
  const { dark, sidebarOpen: _sidebarOpen, toggleDark, toggleSidebar } = useThemeStore()
  const { labData } = useLabStore()
  const { notifications, markAllRead, clearAll } = useNotifStore()
  const { user, logout } = useAuthStore()
  const { editMode, setEditMode } = useLayoutStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [showLogoutGuard, setShowLogoutGuard] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const allPCs     = Object.values(labData).flat()
  const total      = allPCs.length
  const available  = allPCs.filter(p => p.status === 'available').length
  const occupied   = allPCs.filter(p => p.status === 'occupied').length
  const maintenance= allPCs.filter(p => p.status === 'maintenance').length
  const unread     = notifications.filter(n => !n.read).length

  // Close notif dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [notifOpen])

  return (
    <header className={cn(
      'h-14 flex items-center gap-2 sm:gap-3 px-2 sm:px-4 flex-shrink-0',
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

      {/* Logos */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* SUNN University Logo */}
        <img
          src="/logos/sunn-logo.png"
          alt="SUNN University"
          className="h-8 sm:h-9 w-auto object-contain flex-shrink-0"
        />
        <div className="hidden sm:block">
          <div className={cn(
            'text-[13px] font-bold leading-tight',
            dark ? 'text-slate-100' : 'text-slate-900'
          )}>
            CCIS Lab Monitor
          </div>
          <div className={cn(
            'text-[10px] leading-none',
            dark ? 'text-slate-600' : 'text-slate-400'
          )}>
            SUNN &middot; College of Computing &amp; Information Sciences
          </div>
        </div>
      </div>

      {/* Global stats — hidden on mobile */}
      <div className="ml-auto hidden sm:flex items-center gap-0">
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

      {/* Live indicator — pushed right on mobile */}
      <div className={cn(
        'flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full border ml-auto sm:ml-0',
        dark
          ? 'bg-dark-surfaceAlt border-dark-border'
          : 'bg-slate-50 border-slate-200'
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-live-pulse block" />
        <span className={cn('text-[11px] font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>
          Live
        </span>
      </div>

      {/* Notifications bell + dropdown */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen(o => !o)}
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

        {/* Notification dropdown panel */}
        {notifOpen && (
          <div className={cn(
            'absolute right-0 top-10 w-80 max-h-96 rounded-xl border shadow-xl z-[80] overflow-hidden flex flex-col animate-fade-in',
            dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200',
          )}>
            {/* Header */}
            <div className={cn(
              'flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0',
              dark ? 'border-dark-border' : 'border-slate-100',
            )}>
              <span className={cn('text-[12px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
                Notifications {unread > 0 && <span className="text-rose-500 ml-1">({unread})</span>}
              </span>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    title="Mark all read"
                    className={cn('p-1 rounded-md transition-colors', dark ? 'hover:bg-dark-surfaceAlt text-slate-500' : 'hover:bg-slate-100 text-slate-400')}
                  >
                    <Check size={13} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => { clearAll(); setNotifOpen(false) }}
                    title="Clear all"
                    className={cn('p-1 rounded-md transition-colors', dark ? 'hover:bg-dark-surfaceAlt text-slate-500' : 'hover:bg-slate-100 text-slate-400')}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className={cn('py-8 text-center text-[12px]', dark ? 'text-slate-600' : 'text-slate-400')}>
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 30).map(n => {
                  const levelColors = {
                    info:    { dot: '#5b7fff', bg: dark ? 'rgba(91,127,255,0.06)' : 'rgba(91,127,255,0.04)' },
                    warning: { dot: '#f59e0b', bg: dark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)' },
                    error:   { dot: '#f43f5e', bg: dark ? 'rgba(244,63,94,0.06)' : 'rgba(244,63,94,0.04)' },
                  }
                  const lc = levelColors[n.level] ?? levelColors.info
                  const time = new Date(n.timestamp)
                  const ago = formatTimeAgo(time)

                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'px-3 py-2 border-b transition-colors',
                        dark ? 'border-dark-borderSub' : 'border-slate-50',
                        !n.read && 'font-medium',
                      )}
                      style={{ background: !n.read ? lc.bg : undefined }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: lc.dot }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-[11px] leading-snug', dark ? 'text-slate-300' : 'text-slate-700')}>
                            {n.message}
                          </p>
                          <p className={cn('text-[9px] mt-0.5', dark ? 'text-slate-600' : 'text-slate-400')}>
                            {ago}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

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

      {/* User info + Logout */}
      {user && (
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'hidden sm:flex flex-col items-end mr-1',
          )}>
            <span className={cn('text-[11px] font-medium leading-tight', dark ? 'text-slate-300' : 'text-slate-700')}>
              {user.name}
            </span>
            <span className={cn(
              'text-[9px] uppercase tracking-wider font-semibold leading-tight',
              user.role === 'admin'
                ? 'text-[#5b7fff]'
                : (dark ? 'text-slate-600' : 'text-slate-400')
            )}>
              {user.role}
            </span>
          </div>
          <button
            onClick={() => {
              if (editMode) { setShowLogoutGuard(true); return }
              logout()
            }}
            title="Sign out"
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-colors border',
              dark
                ? 'text-slate-400 hover:text-rose-400 hover:bg-dark-surfaceAlt border-dark-border bg-dark-surfaceAlt'
                : 'text-slate-500 hover:text-rose-500 hover:bg-slate-100 border-slate-200 bg-slate-50'
            )}
          >
            <LogOut size={14} />
          </button>
        </div>
      )}

      <EditGuardDialog
        open={showLogoutGuard}
        message="Logging out will discard any unsaved layout changes. Finish editing first, or discard to sign out."
        confirmLabel="Discard & Sign Out"
        onCancel={() => setShowLogoutGuard(false)}
        onConfirm={() => {
          setEditMode(false)
          setShowLogoutGuard(false)
          logout()
        }}
      />
    </header>
  )
}
