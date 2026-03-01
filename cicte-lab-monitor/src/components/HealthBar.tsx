import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react'
import { useLabStore, useThemeStore } from '@/store'
import { cn } from '@/lib/utils'

// ─── Signal strength icon picker ─────────────────────────────────────────────

export function SignalIcon({ strength, size = 12 }: { strength: number; size?: number }) {
  if (strength >= 75) return <SignalHigh size={size} className="text-emerald-500" />
  if (strength >= 50) return <SignalMedium size={size} className="text-amber-500" />
  if (strength >= 25) return <SignalLow size={size} className="text-orange-500" />
  return <Signal size={size} className="text-rose-500" />
}

// ─── Health Bar (for Topbar) ──────────────────────────────────────────────────

export function HealthBar() {
  const { dark } = useThemeStore()
  const { labData, activeLab } = useLabStore()
  const pcs = labData[activeLab] ?? []

  const online    = pcs.filter(p => p.isOnline !== false).length
  const offline   = pcs.filter(p => p.isOnline === false).length
  const available = pcs.filter(p => p.status === 'available').length
  const availPct  = pcs.length > 0 ? Math.round(available / pcs.length * 100) : 0
  const barColor  = availPct >= 60 ? '#22c55e' : availPct >= 30 ? '#f59e0b' : '#f43f5e'

  return (
    <div className={cn(
      'flex items-center gap-2.5 px-2.5 py-1 rounded-lg border text-[11px]',
      dark
        ? 'bg-dark-surfaceAlt border-dark-border'
        : 'bg-slate-50 border-slate-200'
    )}>
      {/* Online */}
      <div className="flex items-center gap-1" title={`${online} PCs online`}>
        <Wifi size={12} className="text-emerald-500" />
        <span className={cn('font-semibold', dark ? 'text-emerald-400' : 'text-emerald-600')}>
          {online}
        </span>
      </div>

      <div className={cn('w-px h-3.5', dark ? 'bg-dark-border' : 'bg-slate-200')} />

      {/* Offline */}
      <div className="flex items-center gap-1" title={`${offline} PCs offline`}>
        <WifiOff size={12} className="text-rose-500" />
        <span className={cn('font-semibold', dark ? 'text-rose-400' : 'text-rose-600')}>
          {offline}
        </span>
      </div>

      <div className={cn('w-px h-3.5', dark ? 'bg-dark-border' : 'bg-slate-200')} />

      {/* Availability bar */}
      <div className="flex items-center gap-1.5" title={`${availPct}% of PCs available`}>
        <div className={cn('w-16 h-1.5 rounded-full overflow-hidden', dark ? 'bg-dark-border' : 'bg-slate-200')}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${availPct}%`, background: barColor }}
          />
        </div>
        <span className="font-medium" style={{ color: barColor }}>{availPct}%</span>
      </div>
    </div>
  )
}

// ─── Inline heartbeat indicator (for PCTile overlay) ─────────────────────────

export function HeartbeatDot({ isOnline, size = 6 }: { isOnline: boolean; size?: number }) {
  return (
    <span
      className={cn(
        'rounded-full block flex-shrink-0',
        isOnline ? 'bg-emerald-500 animate-live-pulse' : 'bg-rose-500'
      )}
      style={{ width: size, height: size }}
      title={isOnline ? 'Online' : 'Offline'}
    />
  )
}
