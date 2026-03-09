import { useEffect, useRef, useCallback } from 'react'
import { useLabStore, useNotifStore } from '@/store'
import { useAlertStore } from '@/store/alerts'

// ─── Heartbeat Simulation ────────────────────────────────────────────────────
// In production the agent sends real heartbeats.  In dev we simulate them so
// the UI has something to render.  Every 8 s we refresh a random 60 % of PCs
// as "just seen" and let the rest age out.

const HEARTBEAT_INTERVAL = 8_000   // ms between simulation ticks
const STALE_THRESHOLD    = 20_000  // ms — PC considered offline if not seen in this window

export function useHeartbeatSimulation() {
  const { labData, activeLab } = useLabStore()
  const updatePC   = useLabStore(s => s.updatePC)
  const addNotif   = useNotifStore(s => s.addNotif)
  const alertRules = useAlertStore(s => s.rules)
  const firedRef   = useRef<Set<string>>(new Set()) // prevent duplicate notifications for same PC

  const tick = useCallback(() => {
    const pcs = labData[activeLab] ?? []
    const now = new Date().toISOString()
    const nowMs = Date.now()

    pcs.forEach(pc => {
      // If this PC has a real agent (lastSeen set by the server poll), skip simulation
      // so we don't overwrite the real isOnline value with random noise.
      const hasRealAgent = pc.lastSeen && (Date.now() - new Date(pc.lastSeen).getTime()) < 120_000
      if (hasRealAgent) return

      // ~65 % chance we "hear" from this PC each tick (simulation only)
      const heard   = Math.random() < 0.65
      const lastSeen = heard ? now : pc.lastSeen
      const lastMs   = lastSeen ? new Date(lastSeen).getTime() : 0
      const isOnline = (nowMs - lastMs) < STALE_THRESHOLD
      const signal   = heard
        ? Math.min(100, Math.max(40, (pc.signalStrength ?? 80) + (Math.random() * 20 - 10)))
        : Math.max(0, (pc.signalStrength ?? 80) - 15)

      // Only update if something changed
      if (pc.isOnline !== isOnline || heard) {
        updatePC({
          ...pc,
          lastSeen: lastSeen ?? pc.lastSeen,
          isOnline,
          signalStrength: Math.round(signal),
        })
      }

      // Check alert rules for offline PCs
      if (!isOnline && pc.isOnline !== false) {
        const offlineRule = alertRules.find(r => r.condition === 'pc-offline' && r.enabled)
        if (offlineRule && !firedRef.current.has(pc.id)) {
          firedRef.current.add(pc.id)
          addNotif({
            level:   'warning',
            message: `PC-${String(pc.num).padStart(2, '0')} in ${pc.labId.toUpperCase()} went offline`,
            labId:   pc.labId,
            pcId:    pc.id,
          })
        }
      }

      // Clear fired flag when PC comes back online
      if (isOnline && firedRef.current.has(pc.id)) {
        firedRef.current.delete(pc.id)
      }
    })
  }, [labData, activeLab, updatePC, addNotif, alertRules])

  // Keep a ref to the latest tick so the interval always calls the fresh closure
  const tickRef = useRef(tick)
  useEffect(() => { tickRef.current = tick }, [tick])

  const loadLabData = useLabStore(s => s.loadLabData)

  useEffect(() => {
    // Seed initial lastSeen on mount
    const pcs = labData[activeLab] ?? []
    const now = new Date().toISOString()
    pcs.forEach(pc => {
      if (!pc.lastSeen) {
        updatePC({ ...pc, lastSeen: now, isOnline: true, signalStrength: Math.round(60 + Math.random() * 40) })
      }
    })

    const id = setInterval(() => tickRef.current(), HEARTBEAT_INTERVAL)

    // Poll the server every 15 s to pick up real agent status changes and
    // any new PCs auto-created by heartbeats (e.g. a new agent laptop).
    const pollId = setInterval(() => loadLabData(activeLab), 15_000)

    return () => { clearInterval(id); clearInterval(pollId) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLab])

  return null
}
