import { useRef, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useThemeStore } from '@/store'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function EditGuardDialog({
  open,
  title = 'Unsaved Layout Changes',
  message = "You're editing the floor plan layout. This action will discard any unsaved changes. Finish editing first, or discard to continue.",
  confirmLabel = 'Discard & Continue',
  onConfirm,
  onCancel,
}: Props) {
  const { dark } = useThemeStore()
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onCancel()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onCancel])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={dialogRef}
        className={cn(
          'w-80 rounded-xl p-5 shadow-2xl border animate-fade-in',
          dark
            ? 'bg-dark-surface border-dark-border'
            : 'bg-white border-slate-200'
        )}
      >
        {/* Icon + title */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/15">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className={cn('text-sm font-semibold', dark ? 'text-white' : 'text-slate-800')}>
              {title}
            </h3>
            <p className={cn('text-[11px] mt-0.5', dark ? 'text-slate-400' : 'text-slate-500')}>
              You're editing the floor plan layout.
            </p>
          </div>
        </div>

        {/* Message */}
        <p className={cn('text-xs leading-relaxed mb-4', dark ? 'text-slate-400' : 'text-slate-600')}>
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
              dark
                ? 'bg-dark-surfaceAlt hover:bg-dark-border text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            )}
          >
            Keep Editing
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
