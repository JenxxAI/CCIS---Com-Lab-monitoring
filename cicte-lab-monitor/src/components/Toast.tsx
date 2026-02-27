import { useEffect, useRef } from 'react'
import { useThemeStore } from '@/store'
import { useToastStore, type Toast as ToastType } from '@/store/toast'
import { cn } from '@/lib/utils'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  info:    Info,
  error:   AlertTriangle,
} as const

const COLORS: Record<ToastType['level'], { icon: string; bg: string; border: string }> = {
  success: { icon: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)'  },
  warning: { icon: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  info:    { icon: '#5b7fff', bg: 'rgba(91,127,255,0.08)',  border: 'rgba(91,127,255,0.25)' },
  error:   { icon: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.25)'  },
}

function ToastItem({ toast }: { toast: ToastType }) {
  const { dark } = useThemeStore()
  const { dismiss } = useToastStore()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss(toast.id), toast.duration ?? 3000)
    return () => clearTimeout(timerRef.current)
  }, [toast.id, toast.duration, dismiss])

  const Icon = ICONS[toast.level]
  const colors = COLORS[toast.level]

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border shadow-lg animate-fade-in max-w-xs',
        dark ? 'bg-dark-surface' : 'bg-white',
      )}
      style={{
        borderColor: colors.border,
        background: dark ? undefined : colors.bg,
      }}
    >
      <Icon size={16} style={{ color: colors.icon, flexShrink: 0 }} />
      <span className={cn('text-[12px] flex-1', dark ? 'text-slate-300' : 'text-slate-700')}>
        {toast.message}
      </span>
      <button
        onClick={() => dismiss(toast.id)}
        className={cn(
          'w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 transition-colors flex-shrink-0',
          dark ? 'text-slate-500' : 'text-slate-400',
        )}
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-auto">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
