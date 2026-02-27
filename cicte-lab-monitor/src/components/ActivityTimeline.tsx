import { useActivityStore, ACTIVITY_TYPE_META } from '@/store/activity'
import { useThemeStore } from '@/store'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface Props {
  pcId?:  string
  labId?: string
  limit?: number
}

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

export function ActivityTimeline({ pcId, labId, limit = 20 }: Props) {
  const { dark } = useThemeStore()
  const allEvents = useActivityStore(s => s.events)

  const events = allEvents
    .filter(e => {
      if (pcId && e.pcId !== pcId) return false
      if (labId && !pcId && e.labId !== labId) return false
      return true
    })
    .slice(0, limit)

  if (events.length === 0) {
    return (
      <p className={cn('text-[12px] italic', dark ? 'text-slate-600' : 'text-slate-400')}>
        No activity recorded yet.
      </p>
    )
  }

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className={cn(
        'absolute left-[7px] top-2 bottom-2 w-px',
        dark ? 'bg-dark-border' : 'bg-slate-200'
      )} />

      <div className="space-y-2">
        {events.map(event => {
          const meta = ACTIVITY_TYPE_META[event.type]
          return (
            <div key={event.id} className="flex gap-2.5 relative">
              {/* Dot */}
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 text-[8px]"
                style={{ backgroundColor: meta.color + '25', border: `1.5px solid ${meta.color}` }}
              >
                <span className="leading-none">{meta.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-baseline gap-1.5">
                  <span className={cn(
                    'text-[11px] font-medium truncate',
                    dark ? 'text-slate-200' : 'text-slate-700'
                  )}>
                    {event.title}
                  </span>
                </div>
                {event.description && (
                  <p className={cn(
                    'text-[10px] mt-0.5 line-clamp-2',
                    dark ? 'text-slate-500' : 'text-slate-400'
                  )}>
                    {event.description}
                  </p>
                )}
                <div className={cn(
                  'flex items-center gap-1.5 mt-0.5 text-[9px]',
                  dark ? 'text-slate-600' : 'text-slate-400'
                )}>
                  <Clock size={8} />
                  <span>{timeAgo(event.timestamp)}</span>
                  <span>·</span>
                  <span>{event.performedBy}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
