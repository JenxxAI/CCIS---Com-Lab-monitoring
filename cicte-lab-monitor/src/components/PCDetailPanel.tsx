import { X, Monitor, Cpu, Wifi, Shield, Clock, Wrench, Package, ChevronDown, Plus, Check, Ticket, Activity, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge } from './Badge'
import { STATUS_HEX, STATUS_BG_HEX, COND_HEX } from '@/lib/utils'
import { STATUS_META, COND_META } from '@/lib/utils'
import { useLabStore, useAuthStore } from '@/store'
import { useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { cn } from '@/lib/utils'
import { toast } from '@/store/toast'
import { APP_CATALOG, APP_MAP, AppIcon } from '@/lib/appCatalog'
import { CreateTicketDialog } from './CreateTicketDialog'
import { ActivityTimeline } from './ActivityTimeline'
import { useTicketStore, PRIORITY_META, TICKET_STATUS_META } from '@/store/tickets'
import { logActivity } from '@/store/activity'
import { useDeletePC } from '@/hooks/useApi'
import type { PCStatus, PCCondition } from '@/types'

function KV({ label, value, mono = false }: {
  label: string; value: string; mono?: boolean
}) {
  const { dark } = useThemeStore()
  return (
    <div className={cn(
      'flex justify-between items-center py-1.5 gap-2',
      'border-b',
      dark ? 'border-dark-borderSub' : 'border-slate-100'
    )}>
      <span className={cn('text-[11px] flex-shrink-0', dark ? 'text-slate-500' : 'text-slate-400')}>{label}</span>
      <span className={cn(
        'text-[11px] text-right',
        mono
          ? (dark ? 'font-mono font-medium text-slate-200' : 'font-mono font-medium text-slate-700')
          : (dark ? 'text-slate-300' : 'text-slate-600')
      )}>
        {value}
      </span>
    </div>
  )
}

function SectionHead({ title, icon }: { title: string; icon?: React.ReactNode }) {
  const { dark } = useThemeStore()
  return (
    <div className={cn(
      'flex items-center gap-1.5 mt-5 mb-2',
      dark ? 'text-slate-500' : 'text-slate-400'
    )}>
      {icon}
      <span className="text-[10px] font-semibold tracking-widest uppercase">{title}</span>
    </div>
  )
}

export function PCDetailPanel() {
  const { selectedPC, setSelectedPC, activeLab, updatePC } = useLabStore()
  const { dark } = useThemeStore()
  const isAdmin    = useAuthStore(s => s.isAdmin)
  const canManage  = useAuthStore(s => s.canManage)
  const user       = useAuthStore(s => s.user)
  const isStudent  = user?.role === 'student'
  const lab = LABS.find(l => l.id === activeLab)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [showCondPicker, setShowCondPicker] = useState(false)
  const [showPassForm, setShowPassForm] = useState(false)
  const [newPass, setNewPass] = useState('')
  const [showAppPicker, setShowAppPicker] = useState(false)
  const [showTicketDialog, setShowTicketDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const deletePC = useDeletePC()
  const tickets = useTicketStore(s => s.tickets)
  const pcTickets = tickets.filter(t => t.pcId === selectedPC?.id)

  if (!selectedPC) return null

  const sc = STATUS_META[selectedPC.status]
  const cc = COND_META[selectedPC.condition]
  const accent = dark ? '#5b7fff' : '#3a5cf5'

  const changeStatus = (status: PCStatus) => {
    updatePC({ ...selectedPC, status })
    setShowStatusPicker(false)
    toast.success(`PC-${String(selectedPC.num).padStart(2, '0')} → ${STATUS_META[status].label}`)
    logActivity({
      pcId: selectedPC.id,
      labId: selectedPC.labId,
      type: 'status-change',
      title: `Status → ${STATUS_META[status].label}`,
      description: `Changed from ${STATUS_META[selectedPC.status].label}`,
      performedBy: user?.name ?? 'Unknown',
    })
  }

  const changeCondition = (condition: PCCondition) => {
    updatePC({ ...selectedPC, condition })
    setShowCondPicker(false)
    toast.success(`PC-${String(selectedPC.num).padStart(2, '0')} → ${COND_META[condition].label}`)
    logActivity({
      pcId: selectedPC.id,
      labId: selectedPC.labId,
      type: 'condition-change',
      title: `Condition → ${COND_META[condition].label}`,
      description: `Changed from ${COND_META[selectedPC.condition].label}`,
      performedBy: user?.name ?? 'Unknown',
    })
  }

  return (
    <aside
      className={cn(
        'w-full md:w-80 h-full flex-shrink-0 overflow-y-auto animate-fade-in',
        'border-l md:border-l',
        dark
          ? 'bg-dark-surface border-dark-border'
          : 'bg-white border-slate-200'
      )}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className={cn(
              'font-mono text-[22px] font-bold leading-tight',
              dark ? 'text-slate-100' : 'text-slate-900'
            )}>
              PC-{String(selectedPC.num).padStart(2, '0')}
            </div>
            <div className={cn('text-[11px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
              {lab?.name} &middot; {selectedPC.specs.pcType}
            </div>
          </div>
          <button
            onClick={() => setSelectedPC(null)}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center',
              'text-slate-500 hover:text-slate-300 transition-colors',
              dark ? 'bg-dark-surfaceAlt hover:bg-dark-border' : 'bg-slate-100 hover:bg-slate-200'
            )}
          >
            <X size={13} />
          </button>
        </div>

        {/* Status + Condition badges — click to edit (admin only) */}
        <div className="flex gap-2 flex-wrap mb-1">
          {/* Status badge */}
          <div className="relative">
            <button
              onClick={() => canManage && setShowStatusPicker(p => !p)}
              className={cn('inline-flex items-center gap-1', canManage && 'cursor-pointer')}
              title={canManage ? 'Click to change status' : undefined}
            >
              <Badge color={STATUS_HEX[selectedPC.status]} bg={STATUS_BG_HEX[selectedPC.status]}>
                {sc.label}
              </Badge>
              {canManage && <ChevronDown size={10} className={dark ? 'text-slate-600' : 'text-slate-400'} />}
            </button>
            {showStatusPicker && (
              <div className={cn(
                'absolute top-7 left-0 z-50 py-1 rounded-lg border shadow-lg min-w-[120px] animate-fade-in',
                dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200',
              )}>
                {(['available', 'occupied', 'maintenance'] as PCStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-[11px] transition-colors flex items-center gap-2',
                      dark ? 'hover:bg-dark-surfaceAlt' : 'hover:bg-slate-50',
                      selectedPC.status === s && 'font-semibold',
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_HEX[s] }} />
                    <span className={dark ? 'text-slate-300' : 'text-slate-700'}>{STATUS_META[s].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Condition badge */}
          <div className="relative">
            <button
              onClick={() => canManage && setShowCondPicker(p => !p)}
              className={cn('inline-flex items-center gap-1', canManage && 'cursor-pointer')}
              title={canManage ? 'Click to change condition' : undefined}
            >
              <Badge color={COND_HEX[selectedPC.condition]} bg={COND_HEX[selectedPC.condition] + '18'}>
                {cc.label}
              </Badge>
              {canManage && <ChevronDown size={10} className={dark ? 'text-slate-600' : 'text-slate-400'} />}
            </button>
            {showCondPicker && (
              <div className={cn(
                'absolute top-7 left-0 z-50 py-1 rounded-lg border shadow-lg min-w-[130px] animate-fade-in',
                dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200',
              )}>
                {(['good', 'lagging', 'needs_repair', 'damaged'] as PCCondition[]).map(c => (
                  <button
                    key={c}
                    onClick={() => changeCondition(c)}
                    className={cn(
                      'w-full px-3 py-1.5 text-left text-[11px] transition-colors flex items-center gap-2',
                      dark ? 'hover:bg-dark-surfaceAlt' : 'hover:bg-slate-50',
                      selectedPC.condition === c && 'font-semibold',
                    )}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: COND_HEX[c] }} />
                    <span className={dark ? 'text-slate-300' : 'text-slate-700'}>{COND_META[c].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={cn('h-px my-4', dark ? 'bg-dark-border' : 'bg-slate-100')} />

        {/* System Information */}
        <SectionHead title="System" icon={<Monitor size={11} />} />
        <KV label="Type" value={selectedPC.specs.pcType} />
        <KV label="OS" value={selectedPC.specs.os} />
        {selectedPC.specs.osBuild && (
          <KV label="Build" value={selectedPC.specs.osBuild} mono />
        )}

        {/* Hardware */}
        <SectionHead title="Hardware" icon={<Cpu size={11} />} />
        <KV label="CPU" value={selectedPC.specs.cpu} />
        {selectedPC.specs.gpu && (
          <KV label="GPU" value={selectedPC.specs.gpu} />
        )}
        <KV label="RAM" value={selectedPC.specs.ram} />
        <KV label="Storage" value={selectedPC.specs.storage} />
        {selectedPC.specs.motherboard && (
          <KV label="Motherboard" value={selectedPC.specs.motherboard} />
        )}
        {selectedPC.specs.monitor && (
          <KV label="Monitor" value={selectedPC.specs.monitor} />
        )}

        {/* Network */}
        <SectionHead title="Network" icon={<Wifi size={11} />} />
        {selectedPC.specs.ipAddress && (
          <KV label="IP Address" value={selectedPC.specs.ipAddress} mono />
        )}
        {selectedPC.specs.macAddress && (
          <KV label="MAC Address" value={selectedPC.specs.macAddress} mono />
        )}
        {/* Router credentials — admin/staff only */}
        {isAdmin && selectedPC.routerSSID && (
          <KV label="SSID" value={selectedPC.routerSSID} />
        )}
        {isAdmin && selectedPC.routerPassword && (
          <KV label="Router Key" value={selectedPC.routerPassword} mono />
        )}

        {/* Installed Software (legacy tags) */}
        <SectionHead title={`Software \u00b7 ${selectedPC.specs.software.length}`} icon={<Package size={11} />} />
        <div className="flex flex-wrap gap-1 mb-1">
          {selectedPC.specs.software.map((sw) => (
            <span
              key={sw}
              className={cn(
                'inline-block px-2 py-0.5 rounded-md text-[10px] font-medium',
                dark
                  ? 'bg-dark-surfaceAlt border border-dark-border text-slate-400'
                  : 'bg-slate-50 border border-slate-200 text-slate-500'
              )}
            >
              {sw}
            </span>
          ))}
        </div>

        {/* ── Installed Apps (with icons) ─────────────────────────────── */}
        <SectionHead
          title={`Installed Apps \u00b7 ${selectedPC.installedApps.length}`}
          icon={<Package size={11} />}
        />

        {/* App grid */}
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {selectedPC.installedApps.map(appId => {
            const app = APP_MAP[appId]
            if (!app) return null
            return (
              <div
                key={appId}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors group',
                  dark
                    ? 'bg-dark-surfaceAlt border-dark-border hover:border-dark-borderSub'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                )}
              >
                <AppIcon app={app} className="w-5 h-5 flex-shrink-0 rounded-[3px]" />
                <span className={cn(
                  'text-[10px] leading-tight truncate',
                  dark ? 'text-slate-300' : 'text-slate-600'
                )}>
                  {app.name}
                </span>
                {canManage && (
                  <button
                    onClick={() => {
                      const next = selectedPC.installedApps.filter(id => id !== appId)
                      updatePC({ ...selectedPC, installedApps: next })
                      toast.info(`Removed ${app.name}`)
                    }}
                    className={cn(
                      'ml-auto opacity-0 group-hover:opacity-100 transition-opacity',
                      'w-4 h-4 rounded flex items-center justify-center flex-shrink-0',
                      dark
                        ? 'hover:bg-dark-border text-slate-500 hover:text-rose-400'
                        : 'hover:bg-slate-200 text-slate-400 hover:text-rose-500'
                    )}
                    title={`Remove ${app.name}`}
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Manage: Add apps button + picker */}
        {canManage && (
          <div className="relative mb-1">
            <button
              onClick={() => setShowAppPicker(p => !p)}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-[11px] font-medium transition-colors',
                dark
                  ? 'border-dark-border text-slate-500 hover:border-accent hover:text-accent'
                  : 'border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500'
              )}
            >
              <Plus size={12} />
              Add App
            </button>

            {showAppPicker && (
              <div className={cn(
                'absolute bottom-full left-0 right-0 mb-1 z-50 rounded-xl border shadow-xl overflow-hidden animate-fade-in',
                dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200',
              )}>
                <div className={cn(
                  'px-3 py-2 border-b text-[11px] font-semibold',
                  dark ? 'border-dark-border text-slate-300' : 'border-slate-100 text-slate-700'
                )}>
                  App Catalog
                </div>
                <div className="max-h-52 overflow-y-auto p-1.5">
                  {APP_CATALOG.map(app => {
                    const installed = selectedPC.installedApps.includes(app.id)
                    return (
                      <button
                        key={app.id}
                        onClick={() => {
                          if (installed) {
                            const next = selectedPC.installedApps.filter(id => id !== app.id)
                            updatePC({ ...selectedPC, installedApps: next })
                            toast.info(`Removed ${app.name}`)
                          } else {
                            updatePC({ ...selectedPC, installedApps: [...selectedPC.installedApps, app.id] })
                            toast.success(`Added ${app.name}`)
                          }
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors',
                          dark ? 'hover:bg-dark-surfaceAlt' : 'hover:bg-slate-50',
                          installed && (dark ? 'bg-dark-surfaceAlt' : 'bg-blue-50/60'),
                        )}
                      >
                        <AppIcon app={app} className="w-6 h-6 flex-shrink-0 rounded" />
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            'text-[11px] font-medium truncate',
                            dark ? 'text-slate-200' : 'text-slate-700'
                          )}>
                            {app.name}
                          </div>
                          <div className={cn(
                            'text-[9px]',
                            dark ? 'text-slate-600' : 'text-slate-400'
                          )}>
                            {app.category}
                          </div>
                        </div>
                        {installed ? (
                          <Check size={13} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <Plus size={13} className={cn('flex-shrink-0', dark ? 'text-slate-600' : 'text-slate-300')} />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credentials — admin only */}
        {isAdmin && (
          <>
            <SectionHead title="Credentials" icon={<Shield size={11} />} />
            <KV label="Password" value={selectedPC.password} mono />
            <KV label="Changed by" value={selectedPC.lastPasswordChangedBy} />
            <KV label="Date" value={selectedPC.lastPasswordChange} />

            {/* Admin: change password inline */}
            <div className="mt-1.5">
            {showPassForm ? (
              <div className="flex gap-1.5 mt-1">
                <input
                  type="password"
                  autoFocus
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="New password"
                  className={cn(
                    'flex-1 min-w-0 px-2 py-1 text-[11px] rounded-md border outline-none font-mono',
                    dark
                      ? 'bg-dark-surfaceAlt border-dark-border text-slate-200 placeholder:text-slate-600'
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400'
                  )}
                  onKeyDown={e => e.key === 'Escape' && (setShowPassForm(false), setNewPass(''))}
                />
                <button
                  disabled={!newPass.trim()}
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    updatePC({ ...selectedPC, password: newPass.trim(), lastPasswordChange: today, lastPasswordChangedBy: user?.name ?? 'Admin' })
                    logActivity({ pcId: selectedPC.id, labId: selectedPC.labId, type: 'password-change', title: 'Password Changed', description: `Password changed by ${user?.name ?? 'Admin'}`, performedBy: user?.name ?? 'Admin' })
                    toast.success('Password updated')
                    setShowPassForm(false)
                    setNewPass('')
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                    !newPass.trim()
                      ? (dark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  )}
                >
                  <Check size={11} />
                </button>
                <button
                  onClick={() => { setShowPassForm(false); setNewPass('') }}
                  className={cn('px-2 py-1 rounded-md text-[11px]', dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPassForm(true)}
                className={cn(
                  'text-[10px] font-medium mt-0.5',
                  dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                )}
              >
                Change password…
              </button>
            )}
          </div>
          </>
        )}

        {/* Last Session — hidden for student */}
        {!isStudent && (
          <>
            <SectionHead title="Last Session" icon={<Clock size={11} />} />
            <KV label="Student" value={selectedPC.lastStudent} />
            <KV label="Time" value={selectedPC.lastUsed} />
          </>
        )}

        {/* Repair History — hidden for student */}
        {!isStudent && (
          <>
            <SectionHead title={`Repairs \u00b7 ${selectedPC.repairs.length}`} icon={<Wrench size={11} />} />

            {/* Create Ticket button for admin/volunteer */}
            {canManage && (
              <button
                onClick={() => setShowTicketDialog(true)}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed text-[11px] font-medium transition-colors mb-2',
                  dark
                    ? 'border-dark-border text-slate-500 hover:border-accent hover:text-accent'
                    : 'border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-500'
                )}
              >
                <Ticket size={12} />
                Create Repair Ticket
              </button>
            )}

            {/* Open tickets for this PC */}
            {pcTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length > 0 && (
              <div className="mb-2">
                <p className={cn('text-[10px] font-semibold mb-1', dark ? 'text-slate-500' : 'text-slate-400')}>
                  Open Tickets
                </p>
                {pcTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').map(t => {
                  const pmeta = PRIORITY_META[t.priority]
                  const smeta = TICKET_STATUS_META[t.status]
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'px-3 py-2 rounded-lg mb-1.5 border-l-2',
                        dark ? 'bg-dark-surfaceAlt border border-dark-border' : 'bg-slate-50 border border-slate-100'
                      )}
                      style={{ borderLeftColor: pmeta.color }}
                    >
                      <div className={cn('text-[11px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
                        {t.title}
                      </div>
                      <div className={cn('flex items-center gap-1.5 mt-0.5 text-[10px]', dark ? 'text-slate-500' : 'text-slate-400')}>
                        <Badge color={pmeta.color} bg={pmeta.bg}>{pmeta.label}</Badge>
                        <Badge color={smeta.color} bg={smeta.color + '18'}>{smeta.label}</Badge>
                        <span>· {t.assignedTo}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {selectedPC.repairs.length === 0 ? (
              <p className={cn('text-[12px] italic', dark ? 'text-slate-600' : 'text-slate-400')}>
                No repairs logged.
              </p>
            ) : (
              selectedPC.repairs.slice().reverse().map((r) => (
                <div
                  key={r.id}
                  className={cn(
                    'px-3 py-2 rounded-lg mb-1.5',
                    dark
                      ? 'bg-dark-surfaceAlt border border-dark-border'
                      : 'bg-slate-50 border border-slate-100'
                  )}
                >
                  <div className={cn(
                    'text-[12px] font-semibold',
                    dark ? 'text-slate-200' : 'text-slate-800'
                  )}>{r.type}</div>
                  <div className={cn('text-[11px] mt-0.5', dark ? 'text-slate-500' : 'text-slate-400')}>
                    {r.date} &middot; {r.by}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Activity Timeline ─────────────────────────────────────── */}
        <SectionHead title="Activity" icon={<Activity size={11} />} />
        <ActivityTimeline pcId={selectedPC.id} labId={selectedPC.labId} limit={8} />

        {/* Quick summary bar */}
        <div className={cn(
          'mt-5 p-3 rounded-xl text-center',
          dark ? 'bg-dark-surfaceAlt border border-dark-border' : 'bg-slate-50 border border-slate-100'
        )}>
          <div className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: accent }}>
            Quick Summary
          </div>
          <div className="flex justify-around text-[11px]">
            <div>
              <div className="font-semibold" style={{ color: STATUS_HEX[selectedPC.status] }}>{sc.label}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Status</div>
            </div>
            <div>
              <div className="font-semibold" style={{ color: COND_HEX[selectedPC.condition] }}>{cc.label}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Condition</div>
            </div>
            <div>
              <div className={cn('font-semibold', dark ? 'text-slate-200' : 'text-slate-700')}>{selectedPC.installedApps.length}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Apps</div>
            </div>
            <div>
              <div className={cn('font-semibold', selectedPC.repairs.length > 3 ? 'text-orange-500' : (dark ? 'text-slate-200' : 'text-slate-700'))}>{selectedPC.repairs.length}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Repairs</div>
            </div>
            <div>
              <div className={cn('font-semibold', pcTickets.filter(t => t.status === 'open').length > 0 ? 'text-red-400' : (dark ? 'text-slate-200' : 'text-slate-700'))}>{pcTickets.length}</div>
              <div className={dark ? 'text-slate-600' : 'text-slate-400'}>Tickets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket creation dialog */}
      {selectedPC && (
        <CreateTicketDialog
          open={showTicketDialog}
          pcId={selectedPC.id}
          labId={selectedPC.labId}
          pcNum={selectedPC.num}
          onClose={() => setShowTicketDialog(false)}
        />
      )}

      {/* Delete PC — admin/staff only */}
      {isAdmin && (
        <div className={cn('px-4 sm:px-5 pb-5 pt-1 border-t', dark ? 'border-dark-border' : 'border-slate-100')}>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed text-[11px] font-medium transition-colors',
                dark
                  ? 'border-rose-500/30 text-rose-500/60 hover:border-rose-500/60 hover:text-rose-400'
                  : 'border-rose-300 text-rose-400 hover:border-rose-400 hover:text-rose-600'
              )}
            >
              <Trash2 size={12} />
              Delete PC
            </button>
          ) : (
            <div className={cn('p-3 rounded-xl border', dark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200')}>
              <p className={cn('text-[11px] mb-2 font-medium', dark ? 'text-rose-300' : 'text-rose-700')}>
                Delete PC-{String(selectedPC.num).padStart(2, '0')}? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className={cn('flex-1 px-3 py-1.5 rounded-lg border text-[11px] transition-colors',
                    dark ? 'border-dark-border text-slate-400 hover:bg-dark-surfaceAlt' : 'border-slate-200 text-slate-500 hover:bg-white')}
                >
                  Cancel
                </button>
                <button
                  disabled={deletePC.isPending}
                  onClick={async () => {
                    try {
                      await deletePC.mutateAsync({ id: selectedPC.id, labId: selectedPC.labId })
                      toast.success(`PC-${String(selectedPC.num).padStart(2, '0')} deleted`)
                      setSelectedPC(null)
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : 'Failed to delete PC')
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-medium transition-colors disabled:opacity-50"
                >
                  {deletePC.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
