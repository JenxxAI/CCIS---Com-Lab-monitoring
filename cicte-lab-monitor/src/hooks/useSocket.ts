import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useLabStore, useNotifStore } from '@/store'
import type { PC } from '@/types'

// ─── Real-time socket hook ────────────────────────────────────────────────────
// Connects to the backend Socket.io server and keeps PC state in sync.
// In development without a backend, this gracefully does nothing.

export function useSocket() {
  const socketRef  = useRef<Socket | null>(null)
  const updatePC   = useLabStore(s => s.updatePC)
  const addNotif   = useNotifStore(s => s.addNotif)

  useEffect(() => {
    // Only connect if a backend URL is configured
    const url = import.meta.env.VITE_SOCKET_URL
    if (!url) return

    const socket = io(url, {
      transports: ['websocket'],
      autoConnect: true,
    })
    socketRef.current = socket

    // PC status or condition changed
    socket.on('pc:updated', (pc: PC) => {
      updatePC(pc)
      if (pc.status === 'maintenance') {
        addNotif({
          level:   'warning',
          message: `PC-${String(pc.num).padStart(2,'0')} in ${pc.labId.toUpperCase()} flagged for maintenance`,
          labId:   pc.labId,
          pcId:    pc.id,
        })
      }
      if (pc.condition === 'damaged') {
        addNotif({
          level:   'error',
          message: `PC-${String(pc.num).padStart(2,'0')} in ${pc.labId.toUpperCase()} is damaged`,
          labId:   pc.labId,
          pcId:    pc.id,
        })
      }
    })

    // Repair logged
    socket.on('pc:repaired', (pc: PC) => {
      updatePC(pc)
      addNotif({
        level:   'info',
        message: `Repair logged on PC-${String(pc.num).padStart(2,'0')} in ${pc.labId.toUpperCase()}`,
        labId:   pc.labId,
        pcId:    pc.id,
      })
    })

    socket.on('connect_error', () => {
      console.warn('[Socket] Could not connect to backend — running in offline mode')
    })

    return () => { socket.disconnect() }
  }, [updatePC, addNotif])

  return socketRef
}
