import { useState, useEffect } from 'react'
import {
  Ticket, Calendar, Package, Activity, Plus, Search, Clock,
  AlertTriangle, X, Wrench,
  Trash2, RefreshCcw, Check,
} from 'lucide-react'
import { useThemeStore, useAuthStore, useNotifStore } from '@/store'
import { useTicketStore, PRIORITY_META, TICKET_STATUS_META } from '@/store/tickets'
import { useScheduleStore, MAINT_TYPE_META, MAINT_STATUS_META, createMaintenanceEvent } from '@/store/schedule'
import { useInventoryStore, PART_CATEGORY_META, createSparePart } from '@/store/inventory'
import { useActivityStore, ACTIVITY_TYPE_META, logActivity } from '@/store/activity'
import {
  generateMockTickets, generateMockMaintenanceEvents,
  generateMockParts, generateMockActivity,
} from '@/lib/mockMaintenance'
import { LABS } from '@/lib/data'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast'
import { Badge } from '@/components/Badge'
import type {
  TicketPriority, TicketStatus,
  MaintenanceEvent, MaintenanceType, MaintenanceStatus,
  PartCategory,
} from '@/types'

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

type SubTab = 'tickets' | 'calendar' | 'inventory' | 'activity'

const SUB_TABS: { id: SubTab; label: string; icon: typeof Ticket }[] = [
  { id: 'tickets',   label: 'Tickets',   icon: Ticket },
  { id: 'calendar',  label: 'Schedule',  icon: Calendar },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'activity',  label: 'Activity',  icon: Activity },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export function MaintenanceHub() {
  const { dark } = useThemeStore()
  const [activeTab, setActiveTab] = useState<SubTab>('tickets')
  const tickets = useTicketStore(s => s.tickets)
  const scheduleEvents = useScheduleStore(s => s.events)
  const parts = useInventoryStore(s => s.parts)
  const activities = useActivityStore(s => s.events)

  // Seed mock data if stores are empty
  useEffect(() => {
    if (tickets.length === 0) {
      useTicketStore.getState().setTickets(generateMockTickets())
    }
    if (scheduleEvents.length === 0) {
      useScheduleStore.getState().setEvents(generateMockMaintenanceEvents())
    }
    if (parts.length === 0) {
      const freshParts = generateMockParts()
      useInventoryStore.getState().setParts(freshParts)
      // Fire low-stock alerts for any part at or below minimum
      freshParts.forEach(p => {
        if (p.quantity <= p.minStock) {
          useNotifStore.getState().addNotif({
            level: 'warning',
            message: `Low stock: ${p.name} (${p.quantity} left, min ${p.minStock})`,
          })
        }
      })
    }
    if (activities.length === 0) {
      useActivityStore.getState().setEvents(generateMockActivity())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const accent = dark ? '#5b7fff' : '#3a5cf5'

  // Quick stats
  const openTickets    = tickets.filter(t => t.status === 'open').length
  const inProgress     = tickets.filter(t => t.status === 'in-progress').length
  const upcoming       = scheduleEvents.filter(e => e.status === 'scheduled').length
  const lowStockParts  = parts.filter(p => p.quantity <= p.minStock).length

  return (
    <div className="h-full overflow-auto p-3 sm:p-5">
      {/* Header */}
      <div className="mb-4">
        <h1 className={cn('text-lg font-bold', dark ? 'text-slate-100' : 'text-slate-900')}>
          Repair &amp; Maintenance Hub
        </h1>
        <p className={cn('text-[12px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
          Track repair tickets, schedule maintenance, manage parts inventory, and review activity logs
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        {[
          { label: 'Open Tickets',   value: openTickets,   color: '#EF4444', icon: AlertTriangle },
          { label: 'In Progress',    value: inProgress,    color: '#F59E0B', icon: Wrench },
          { label: 'Upcoming Maint', value: upcoming,      color: '#3B82F6', icon: Calendar },
          { label: 'Low Stock Parts',value: lowStockParts, color: lowStockParts > 0 ? '#EF4444' : '#10B981', icon: Package },
        ].map(stat => (
          <div
            key={stat.label}
            className={cn(
              'p-3 rounded-xl border',
              dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={13} style={{ color: stat.color }} />
              <span className={cn('text-[10px] uppercase tracking-wider font-medium', dark ? 'text-slate-500' : 'text-slate-400')}>
                {stat.label}
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-tab bar */}
      <div className={cn(
        'flex items-center gap-1 mb-4 p-1 rounded-xl border',
        dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
      )}>
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all flex-1 justify-center',
              activeTab === tab.id
                ? 'text-white shadow-sm'
                : (dark ? 'text-slate-400 hover:text-slate-300 hover:bg-dark-surfaceAlt' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')
            )}
            style={activeTab === tab.id ? { backgroundColor: accent } : undefined}
          >
            <tab.icon size={13} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'tickets'   && <TicketsTab />}
      {activeTab === 'calendar'  && <CalendarTab />}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'activity'  && <ActivityTab />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TICKETS TAB ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function TicketsTab() {
  const { dark } = useThemeStore()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const user = useAuthStore(s => s.user)
  const { tickets, updateTicket, removeTicket, resolveTicket } = useTicketStore()
  const [searchQ, setSearchQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all')
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!t.title.toLowerCase().includes(q) &&
          !t.pcId.toLowerCase().includes(q) &&
          !t.assignedTo.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleResolve = (id: string) => {
    resolveTicket(id, resolution)
    const ticket = tickets.find(t => t.id === id)
    if (ticket) {
      logActivity({
        pcId: ticket.pcId,
        labId: ticket.labId,
        type: 'ticket-resolved',
        title: `Ticket resolved: ${ticket.title}`,
        description: resolution || 'No resolution notes provided.',
        performedBy: user?.name ?? 'Unknown',
        metadata: { ticketId: id },
      })
    }
    toast.success('Ticket resolved')
    setResolveId(null)
    setResolution('')
  }

  const inputCls = cn(
    'rounded-lg border px-3 py-1.5 text-[12px] outline-none transition-colors',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
      : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
  )

  return (
    <div>
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', dark ? 'text-slate-600' : 'text-slate-400')} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search tickets..."
            className={cn(inputCls, 'w-full pl-8')}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as TicketStatus | 'all')}
          className={inputCls}
        >
          <option value="all">All Status</option>
          {Object.entries(TICKET_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value as TicketPriority | 'all')}
          className={inputCls}
        >
          <option value="all">All Priority</option>
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className={cn('text-[11px] mb-2', dark ? 'text-slate-600' : 'text-slate-400')}>
        {filtered.length} ticket{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Ticket list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className={cn(
            'text-center py-10 text-[13px]',
            dark ? 'text-slate-600' : 'text-slate-400'
          )}>
            No tickets match your filters.
          </div>
        ) : filtered.map(ticket => {
          const lab = LABS.find(l => l.id === ticket.labId)
          const pmeta = PRIORITY_META[ticket.priority]
          const smeta = TICKET_STATUS_META[ticket.status]
          const isResolving = resolveId === ticket.id

          return (
            <div
              key={ticket.id}
              className={cn(
                'p-3 rounded-xl border transition-colors',
                dark ? 'bg-dark-surface border-dark-border hover:border-dark-borderSub' : 'bg-white border-slate-200 hover:border-slate-300'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Priority indicator */}
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: pmeta.color }}
                />

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        'text-[13px] font-semibold truncate',
                        dark ? 'text-slate-100' : 'text-slate-900'
                      )}>
                        {ticket.title}
                      </h3>
                      <div className={cn('flex items-center gap-1.5 mt-0.5 text-[10px] flex-wrap', dark ? 'text-slate-500' : 'text-slate-400')}>
                        <span className="font-mono">{ticket.pcId.toUpperCase()}</span>
                        <span>·</span>
                        <span>{lab?.short ?? ticket.labId}</span>
                        <span>·</span>
                        <span>{timeAgo(ticket.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge color={pmeta.color} bg={pmeta.bg}>{pmeta.label}</Badge>
                      <Badge color={smeta.color} bg={smeta.color + '18'}>{smeta.label}</Badge>
                    </div>
                  </div>

                  {/* Description */}
                  {ticket.description && (
                    <p className={cn('text-[11px] mt-1.5 line-clamp-2', dark ? 'text-slate-400' : 'text-slate-500')}>
                      {ticket.description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className={cn('flex items-center gap-3 mt-2 text-[10px]', dark ? 'text-slate-500' : 'text-slate-400')}>
                    <span>Assigned: <strong className={dark ? 'text-slate-300' : 'text-slate-600'}>{ticket.assignedTo}</strong></span>
                    <span>Est: {ticket.estimatedMinutes}min</span>
                    {ticket.resolvedAt && (
                      <span className="text-emerald-500">Resolved {timeAgo(ticket.resolvedAt)}</span>
                    )}
                  </div>

                  {/* Resolution */}
                  {ticket.resolution && (
                    <div className={cn(
                      'mt-2 px-2.5 py-1.5 rounded-lg text-[11px] border',
                      dark ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                    )}>
                      <strong>Resolution:</strong> {ticket.resolution}
                    </div>
                  )}

                  {/* Resolve input */}
                  {isResolving && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={resolution}
                        onChange={e => setResolution(e.target.value)}
                        placeholder="Resolution notes..."
                        className={cn(inputCls, 'flex-1')}
                        autoFocus
                      />
                      <button
                        onClick={() => handleResolve(ticket.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-white"
                        style={{ backgroundColor: '#10B981' }}
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => { setResolveId(null); setResolution('') }}
                        className={cn('px-2 py-1.5 rounded-lg text-[11px]', dark ? 'text-slate-500 hover:bg-dark-surfaceAlt' : 'text-slate-400 hover:bg-slate-100')}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Admin actions */}
                  {isAdmin && !isResolving && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {ticket.status === 'open' && (
                        <button
                          onClick={() => {
                            updateTicket(ticket.id, { status: 'in-progress' })
                            toast.info('Ticket marked in-progress')
                          }}
                          className={cn(
                            'px-2 py-1 rounded-md text-[10px] font-medium border transition-colors',
                            dark ? 'border-dark-border text-slate-400 hover:border-amber-600 hover:text-amber-400' : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600'
                          )}
                        >
                          Start Work
                        </button>
                      )}
                      <button
                        onClick={() => setResolveId(ticket.id)}
                        className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-medium border transition-colors',
                          dark ? 'border-dark-border text-slate-400 hover:border-emerald-600 hover:text-emerald-400' : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'
                        )}
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => {
                          removeTicket(ticket.id)
                          toast.info('Ticket removed')
                        }}
                        className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-medium border transition-colors',
                          dark ? 'border-dark-border text-slate-400 hover:border-rose-600 hover:text-rose-400' : 'border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600'
                        )}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CALENDAR / SCHEDULE TAB ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function CalendarTab() {
  const { dark } = useThemeStore()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const user = useAuthStore(s => s.user)
  const { events, addEvent, updateEvent } = useScheduleStore()
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all')

  // New event form state
  const [nTitle, setNTitle] = useState('')
  const [nDesc, setNDesc]   = useState('')
  const [nLab, setNLab]     = useState('cl1')
  const [nDate, setNDate]   = useState(new Date().toISOString().slice(0, 10))
  const [nTime, setNTime]   = useState('09:00')
  const [nDur, setNDur]     = useState(60)
  const [nType, setNType]   = useState<MaintenanceType>('preventive')
  const [nAssign] = useState('Admin Ramos')

  const filtered = events.filter(e => statusFilter === 'all' || e.status === statusFilter)

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nTitle.trim()) return

    const event = createMaintenanceEvent({
      labId: nLab,
      title: nTitle.trim(),
      description: nDesc.trim(),
      scheduledDate: nDate,
      scheduledTime: nTime,
      durationMinutes: nDur,
      type: nType,
      assignedTo: nAssign,
      createdBy: user?.name ?? 'Unknown',
      pcIds: [],
    })

    addEvent(event)
    logActivity({
      labId: nLab,
      type: 'maintenance-scheduled',
      title: `Maintenance: ${nTitle.trim()}`,
      description: `Scheduled for ${nDate} at ${nTime}`,
      performedBy: user?.name ?? 'Unknown',
    })
    toast.success('Maintenance event scheduled')
    setShowForm(false)
    setNTitle('')
    setNDesc('')
  }

  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const inputCls = cn(
    'rounded-lg border px-3 py-1.5 text-[12px] outline-none transition-colors w-full',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
      : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
  )

  const labelCls = cn('block text-[11px] font-medium mb-1', dark ? 'text-slate-400' : 'text-slate-500')

  // Group events by date
  const grouped = filtered.reduce<Record<string, MaintenanceEvent[]>>((acc, e) => {
    const key = e.scheduledDate
    ;(acc[key] ??= []).push(e)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as MaintenanceStatus | 'all')}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-[12px] outline-none',
            dark ? 'bg-dark-surfaceAlt border-dark-border text-slate-200' : 'bg-white border-slate-200 text-slate-700'
          )}
        >
          <option value="all">All Status</option>
          {Object.entries(MAINT_STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {isAdmin && (
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            <Plus size={13} />
            Schedule
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className={cn(
            'p-4 rounded-xl border mb-4 space-y-3',
            dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Title</label>
              <input value={nTitle} onChange={e => setNTitle(e.target.value)} className={inputCls} required placeholder="Maintenance title..." />
            </div>
            <div>
              <label className={labelCls}>Lab</label>
              <select value={nLab} onChange={e => setNLab(e.target.value)} className={inputCls}>
                {LABS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={nDesc} onChange={e => setNDesc(e.target.value)} rows={2} className={cn(inputCls, 'resize-none')} placeholder="Details..." />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={nDate} onChange={e => setNDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input type="time" value={nTime} onChange={e => setNTime(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Duration (min)</label>
              <input type="number" value={nDur} onChange={e => setNDur(+e.target.value)} min={15} step={15} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={nType} onChange={e => setNType(e.target.value as MaintenanceType)} className={inputCls}>
                {Object.entries(MAINT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className={cn('px-3 py-1.5 rounded-lg text-[12px]', dark ? 'text-slate-400' : 'text-slate-500')}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ backgroundColor: accent }}>
              Schedule Event
            </button>
          </div>
        </form>
      )}

      {/* Event timeline by date */}
      {sortedDates.length === 0 ? (
        <div className={cn('text-center py-10 text-[13px]', dark ? 'text-slate-600' : 'text-slate-400')}>
          No maintenance events found.
        </div>
      ) : sortedDates.map(date => (
        <div key={date} className="mb-4">
          <div className={cn(
            'text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-2',
            dark ? 'text-slate-500' : 'text-slate-400'
          )}>
            <Calendar size={11} />
            {new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>

          <div className="space-y-2 ml-2 border-l-2 pl-3" style={{ borderColor: dark ? '#2a2f3d' : '#e2e8f0' }}>
            {grouped[date].map(event => {
              const tmeta = MAINT_TYPE_META[event.type]
              const smeta = MAINT_STATUS_META[event.status]
              const lab = LABS.find(l => l.id === event.labId)

              return (
                <div
                  key={event.id}
                  className={cn(
                    'p-3 rounded-xl border transition-colors',
                    dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className={cn('text-[13px] font-semibold', dark ? 'text-slate-100' : 'text-slate-900')}>
                        {event.title}
                      </div>
                      <div className={cn('text-[10px] mt-0.5 flex items-center gap-1.5', dark ? 'text-slate-500' : 'text-slate-400')}>
                        <span>{lab?.short ?? event.labId}</span>
                        <span>·</span>
                        <span>{event.scheduledTime ?? ''}</span>
                        <span>·</span>
                        <span>{event.durationMinutes}min</span>
                        <span>·</span>
                        <span>{event.assignedTo}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge color={tmeta.color} bg={tmeta.color + '18'}>{tmeta.label}</Badge>
                      <Badge color={smeta.color} bg={smeta.color + '18'}>{smeta.label}</Badge>
                    </div>
                  </div>
                  {event.description && (
                    <p className={cn('text-[11px] mt-1.5', dark ? 'text-slate-400' : 'text-slate-500')}>{event.description}</p>
                  )}

                  {/* Admin status actions */}
                  {isAdmin && event.status !== 'completed' && event.status !== 'cancelled' && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {event.status === 'scheduled' && (
                        <button
                          onClick={() => {
                            updateEvent(event.id, { status: 'in-progress' })
                            toast.info('Started maintenance')
                          }}
                          className={cn(
                            'px-2 py-1 rounded-md text-[10px] font-medium border',
                            dark ? 'border-dark-border text-slate-400 hover:text-amber-400' : 'border-slate-200 text-slate-500 hover:text-amber-600'
                          )}
                        >
                          Start
                        </button>
                      )}
                      <button
                        onClick={() => {
                          updateEvent(event.id, { status: 'completed', notes: 'Completed.' })
                          logActivity({
                            labId: event.labId,
                            type: 'maintenance-completed',
                            title: `Maintenance completed: ${event.title}`,
                            description: `${lab?.name ?? event.labId}`,
                            performedBy: user?.name ?? 'Unknown',
                          })
                          toast.success('Maintenance completed')
                        }}
                        className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-medium border',
                          dark ? 'border-dark-border text-slate-400 hover:text-emerald-400' : 'border-slate-200 text-slate-500 hover:text-emerald-600'
                        )}
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => {
                          updateEvent(event.id, { status: 'cancelled' })
                          toast.info('Maintenance cancelled')
                        }}
                        className={cn(
                          'px-2 py-1 rounded-md text-[10px] font-medium border',
                          dark ? 'border-dark-border text-slate-400 hover:text-rose-400' : 'border-slate-200 text-slate-500 hover:text-rose-600'
                        )}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── INVENTORY TAB ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function InventoryTab() {
  const { dark } = useThemeStore()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const { parts, addPart, restockPart, removePart } = useInventoryStore()
  const [searchQ, setSearchQ] = useState('')
  const [catFilter, setCatFilter] = useState<PartCategory | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [restockId, setRestockId] = useState<string | null>(null)
  const [restockQty, setRestockQty] = useState(5)

  // New part form
  const [npName, setNpName] = useState('')
  const [npCat, setNpCat]   = useState<PartCategory>('RAM')
  const [npQty, setNpQty]   = useState(10)
  const [npLoc, setNpLoc]   = useState('Repair Room Cabinet A')
  const [npMin, setNpMin]   = useState(3)

  const filtered = parts.filter(p => {
    if (catFilter !== 'all' && p.category !== catFilter) return false
    if (searchQ && !p.name.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!npName.trim()) return
    addPart(createSparePart({
      name: npName.trim(),
      category: npCat,
      quantity: npQty,
      location: npLoc,
      minStock: npMin,
    }))
    toast.success(`Added ${npName.trim()} to inventory`)
    setShowAdd(false)
    setNpName('')
  }

  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const inputCls = cn(
    'rounded-lg border px-3 py-1.5 text-[12px] outline-none transition-colors',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
      : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
  )

  const labelCls = cn('block text-[11px] font-medium mb-1', dark ? 'text-slate-400' : 'text-slate-500')

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', dark ? 'text-slate-600' : 'text-slate-400')} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search parts..."
            className={cn(inputCls, 'w-full pl-8')}
          />
        </div>
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value as PartCategory | 'all')}
          className={inputCls}
        >
          <option value="all">All Categories</option>
          {Object.entries(PART_CATEGORY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(p => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ backgroundColor: accent }}
          >
            <Plus size={13} />
            Add Part
          </button>
        )}
      </div>

      {/* Add part form */}
      {showAdd && (
        <form
          onSubmit={handleAddPart}
          className={cn(
            'p-4 rounded-xl border mb-4 space-y-3',
            dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
          )}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Part Name</label>
              <input value={npName} onChange={e => setNpName(e.target.value)} className={cn(inputCls, 'w-full')} required placeholder="e.g. DDR4 8GB Stick" />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={npCat} onChange={e => setNpCat(e.target.value as PartCategory)} className={cn(inputCls, 'w-full')}>
                {Object.entries(PART_CATEGORY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" value={npQty} onChange={e => setNpQty(+e.target.value)} min={0} className={cn(inputCls, 'w-full')} />
            </div>
            <div>
              <label className={labelCls}>Min Stock</label>
              <input type="number" value={npMin} onChange={e => setNpMin(+e.target.value)} min={0} className={cn(inputCls, 'w-full')} />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={npLoc} onChange={e => setNpLoc(e.target.value)} className={cn(inputCls, 'w-full')} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className={cn('px-3 py-1.5 rounded-lg text-[12px]', dark ? 'text-slate-400' : 'text-slate-500')}>Cancel</button>
            <button type="submit" className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ backgroundColor: accent }}>Add Part</button>
          </div>
        </form>
      )}

      {/* Parts table */}
      <div className={cn(
        'rounded-xl border overflow-hidden',
        dark ? 'border-dark-border' : 'border-slate-200'
      )}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className={dark ? 'bg-dark-surfaceAlt' : 'bg-slate-50'}>
                {['Part Name', 'Category', 'Qty', 'Min', 'Location', 'Last Restock', 'Actions'].map(h => (
                  <th key={h} className={cn(
                    'px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider',
                    dark ? 'text-slate-500' : 'text-slate-400'
                  )}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={cn('px-3 py-8 text-center', dark ? 'text-slate-600' : 'text-slate-400')}>
                    No parts found.
                  </td>
                </tr>
              ) : filtered.map(part => {
                const cmeta = PART_CATEGORY_META[part.category]
                const isLow = part.quantity <= part.minStock
                const isRestocking = restockId === part.id

                return (
                  <tr
                    key={part.id}
                    className={cn(
                      'border-t transition-colors',
                      dark ? 'border-dark-border hover:bg-dark-surfaceAlt/50' : 'border-slate-100 hover:bg-slate-50/50'
                    )}
                  >
                    <td className={cn('px-3 py-2 font-medium', dark ? 'text-slate-200' : 'text-slate-700')}>
                      {part.name}
                    </td>
                    <td className="px-3 py-2">
                      <Badge color={cmeta.color} bg={cmeta.color + '18'}>{cmeta.label}</Badge>
                    </td>
                    <td className={cn('px-3 py-2 font-mono font-bold', isLow ? 'text-red-500' : (dark ? 'text-slate-200' : 'text-slate-700'))}>
                      {part.quantity}
                      {isLow && <AlertTriangle size={10} className="inline ml-1 text-red-500" />}
                    </td>
                    <td className={cn('px-3 py-2 font-mono', dark ? 'text-slate-500' : 'text-slate-400')}>
                      {part.minStock}
                    </td>
                    <td className={cn('px-3 py-2', dark ? 'text-slate-400' : 'text-slate-500')}>
                      {part.location}
                    </td>
                    <td className={cn('px-3 py-2', dark ? 'text-slate-500' : 'text-slate-400')}>
                      {part.lastRestocked ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          {isRestocking ? (
                            <>
                              <input
                                type="number"
                                value={restockQty}
                                onChange={e => setRestockQty(+e.target.value)}
                                min={1}
                                className={cn(inputCls, 'w-16 py-1')}
                              />
                              <button
                                onClick={() => {
                                  restockPart(part.id, restockQty)
                                  toast.success(`Restocked ${part.name} +${restockQty}`)
                                  setRestockId(null)
                                }}
                                className="p-1 rounded text-emerald-500 hover:bg-emerald-500/10"
                              >
                                <Check size={12} />
                              </button>
                              <button onClick={() => setRestockId(null)} className="p-1 rounded text-slate-500 hover:bg-slate-500/10">
                                <X size={12} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => { setRestockId(part.id); setRestockQty(5) }}
                                className={cn('p-1 rounded transition-colors', dark ? 'text-slate-500 hover:text-emerald-400' : 'text-slate-400 hover:text-emerald-600')}
                                title="Restock"
                              >
                                <RefreshCcw size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  removePart(part.id)
                                  toast.info(`Removed ${part.name}`)
                                }}
                                className={cn('p-1 rounded transition-colors', dark ? 'text-slate-500 hover:text-rose-400' : 'text-slate-400 hover:text-rose-600')}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory summary */}
      <div className={cn(
        'mt-3 p-3 rounded-xl border text-[11px]',
        dark ? 'bg-dark-surface border-dark-border text-slate-400' : 'bg-white border-slate-200 text-slate-500'
      )}>
        Total parts: <strong className={dark ? 'text-slate-200' : 'text-slate-700'}>{parts.length}</strong>
        {' · '}
        Total stock: <strong className={dark ? 'text-slate-200' : 'text-slate-700'}>{parts.reduce((s, p) => s + p.quantity, 0)}</strong>
        {' · '}
        Low stock: <strong className={parts.filter(p => p.quantity <= p.minStock).length > 0 ? 'text-red-500' : 'text-emerald-500'}>
          {parts.filter(p => p.quantity <= p.minStock).length}
        </strong>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ACTIVITY TAB ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityTab() {
  const { dark } = useThemeStore()
  const { events, clearAll } = useActivityStore()
  const isAdmin = useAuthStore(s => s.isAdmin)
  const [searchQ, setSearchQ] = useState('')
  const [labFilter, setLabFilter] = useState<string>('all')

  const filtered = events.filter(e => {
    if (labFilter !== 'all' && e.labId !== labFilter) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!e.title.toLowerCase().includes(q) &&
          !e.performedBy.toLowerCase().includes(q) &&
          !(e.pcId ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const inputCls = cn(
    'rounded-lg border px-3 py-1.5 text-[12px] outline-none transition-colors',
    dark
      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
      : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'
  )

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className={cn('absolute left-2.5 top-1/2 -translate-y-1/2', dark ? 'text-slate-600' : 'text-slate-400')} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search activity..."
            className={cn(inputCls, 'w-full pl-8')}
          />
        </div>
        <select
          value={labFilter}
          onChange={e => setLabFilter(e.target.value)}
          className={inputCls}
        >
          <option value="all">All Labs</option>
          {LABS.map(l => <option key={l.id} value={l.id}>{l.short}</option>)}
        </select>
        {isAdmin && events.length > 0 && (
          <button
            onClick={() => { clearAll(); toast.info('Activity log cleared') }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors',
              dark ? 'border-dark-border text-slate-400 hover:text-rose-400' : 'border-slate-200 text-slate-500 hover:text-rose-600'
            )}
          >
            Clear Log
          </button>
        )}
      </div>

      <p className={cn('text-[11px] mb-2', dark ? 'text-slate-600' : 'text-slate-400')}>
        {filtered.length} event{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className={cn('text-center py-10 text-[13px]', dark ? 'text-slate-600' : 'text-slate-400')}>
          No activity found.
        </div>
      ) : (
        <div className="relative">
          <div className={cn(
            'absolute left-[7px] top-2 bottom-2 w-px',
            dark ? 'bg-dark-border' : 'bg-slate-200'
          )} />

          <div className="space-y-2">
            {filtered.slice(0, 100).map(event => {
              const meta = ACTIVITY_TYPE_META[event.type]
              const lab = LABS.find(l => l.id === event.labId)
              return (
                <div key={event.id} className="flex gap-2.5 relative">
                  <div
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 text-[8px]"
                    style={{ backgroundColor: meta.color + '25', border: `1.5px solid ${meta.color}` }}
                  >
                    <span className="leading-none">{meta.icon}</span>
                  </div>
                  <div className={cn(
                    'flex-1 min-w-0 p-2.5 rounded-xl border',
                    dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
                  )}>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className={cn('text-[11px] font-medium', dark ? 'text-slate-200' : 'text-slate-700')}>
                        {event.title}
                      </span>
                      {event.pcId && (
                        <span className={cn('text-[9px] font-mono', dark ? 'text-slate-500' : 'text-slate-400')}>
                          {event.pcId.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className={cn('text-[10px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
                        {event.description}
                      </p>
                    )}
                    <div className={cn('flex items-center gap-1.5 mt-1 text-[9px]', dark ? 'text-slate-600' : 'text-slate-400')}>
                      <Clock size={8} />
                      <span>{timeAgo(event.timestamp)}</span>
                      <span>·</span>
                      <span>{event.performedBy}</span>
                      <span>·</span>
                      <span>{lab?.short ?? event.labId}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
