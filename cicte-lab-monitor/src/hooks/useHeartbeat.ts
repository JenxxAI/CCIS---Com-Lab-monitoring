import { useEffect } from 'react'
import { useAuthStore, useLabStore } from '@/store'

/** Live monitoring uses server-reported agent data only. */
export function useHeartbeatPolling() {
  const activeLab = useLabStore(s => s.activeLab)
  const loadLabData = useLabStore(s => s.loadLabData)
  const token = useAuthStore(s => s.token)

  useEffect(() => {
    if (!token) return
    void loadLabData(activeLab)
    const pollId = setInterval(() => void loadLabData(activeLab), 15_000)
    return () => clearInterval(pollId)
  }, [activeLab, loadLabData, token])
}
