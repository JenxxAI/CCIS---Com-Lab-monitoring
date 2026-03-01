import { useEffect, useRef } from 'react'
import { useScheduleStore } from '@/store/schedule'
import { useNotifStore } from '@/store'

const REMINDER_DAYS = 3   // Fire a reminder if event is within this many days
const STORAGE_KEY   = 'cicte-maint-reminded'

/**
 * On mount, checks for upcoming maintenance events within REMINDER_DAYS days
 * and fires a notification for each one (once per session, tracked in sessionStorage).
 */
export function useMaintenanceReminders() {
  const events   = useScheduleStore(s => s.events)
  const addNotif = useNotifStore(s => s.addNotif)
  const checked  = useRef(false)

  useEffect(() => {
    if (checked.current || events.length === 0) return
    checked.current = true

    const alreadyFired: string[] = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')
    const now   = Date.now()
    let updated = [...alreadyFired]

    events.forEach(ev => {
      if (ev.status !== 'scheduled' && ev.status !== 'in-progress') return
      if (alreadyFired.includes(ev.id)) return

      const evMs = new Date(`${ev.scheduledDate}T${ev.scheduledTime ?? '08:00'}`).getTime()
      const diffDays = (evMs - now) / 86_400_000

      if (diffDays < 0) {
        // Overdue
        addNotif({
          level:   'error',
          message: `Overdue maintenance: "${ev.title}" was scheduled on ${ev.scheduledDate}`,
          labId:   ev.labId,
        })
        updated.push(ev.id)
      } else if (diffDays <= REMINDER_DAYS) {
        const label = diffDays < 1
          ? 'today'
          : diffDays < 2 ? 'tomorrow' : `in ${Math.ceil(diffDays)} days`
        addNotif({
          level:   'warning',
          message: `Upcoming maintenance: "${ev.title}" in ${ev.labId.toUpperCase()} — ${label}`,
          labId:   ev.labId,
        })
        updated.push(ev.id)
      }
    })

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [events, addNotif])
}
