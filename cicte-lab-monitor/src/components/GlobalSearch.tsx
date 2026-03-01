import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Monitor } from 'lucide-react'
import { useLabStore, useThemeStore } from '@/store'
import { LABS } from '@/lib/data'
import { STATUS_HEX, STATUS_BG_HEX, STATUS_META, COND_HEX, COND_META, cn } from '@/lib/utils'
import { Badge } from './Badge'
import type { PC } from '@/types'

// ─── Global Search Modal ─────────────────────────────────────────────────────
// Opens with Ctrl+K / Cmd+K. Searches all labs for matching PCs.

interface Props {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: Props) {
  const { dark } = useThemeStore()
  const { labData, setActiveLab, setSelectedPC } = useLabStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const allPCs: (PC & { labName: string })[] = Object.entries(labData).flatMap(([labId, pcs]) => {
    const lab = LABS.find(l => l.id === labId)
    return pcs.map(pc => ({ ...pc, labName: lab?.name ?? labId }))
  })

  const q = query.trim().toLowerCase()
  const results = q
    ? allPCs.filter(pc =>
        String(pc.num).includes(q) ||
        pc.lastStudent.toLowerCase().includes(q) ||
        pc.lastPasswordChangedBy.toLowerCase().includes(q) ||
        pc.specs.cpu.toLowerCase().includes(q) ||
        pc.specs.os.toLowerCase().includes(q) ||
        pc.labName.toLowerCase().includes(q) ||
        pc.status.includes(q) ||
        pc.condition.includes(q)
      ).slice(0, 20)
    : []

  const handleSelect = useCallback((pc: PC & { labName: string }) => {
    setActiveLab(pc.labId)
    setSelectedPC(pc)
    onClose()
  }, [setActiveLab, setSelectedPC, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-fade-in',
        dark ? 'bg-dark-surface border-dark-border' : 'bg-white border-slate-200'
      )}>
        {/* Search input */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-3.5 border-b',
          dark ? 'border-dark-border' : 'border-slate-100'
        )}>
          <Search size={16} className={dark ? 'text-slate-500' : 'text-slate-400'} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search PCs across all labs…"
            className={cn(
              'flex-1 bg-transparent outline-none text-[13px] placeholder:text-slate-500',
              dark ? 'text-slate-200' : 'text-slate-800'
            )}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={14} className={dark ? 'text-slate-500' : 'text-slate-400'} />
            </button>
          )}
          <kbd className={cn(
            'hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border',
            dark ? 'bg-dark-surfaceAlt border-dark-border text-slate-600' : 'bg-slate-100 border-slate-200 text-slate-400'
          )}>
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[52vh] overflow-y-auto">
          {q === '' && (
            <div className={cn('py-8 text-center text-[12px]', dark ? 'text-slate-600' : 'text-slate-400')}>
              Start typing to search PCs, students, or specs across all labs
            </div>
          )}
          {q !== '' && results.length === 0 && (
            <div className={cn('py-8 text-center text-[12px]', dark ? 'text-slate-600' : 'text-slate-400')}>
              No PCs matched <span className="font-mono">"{query}"</span>
            </div>
          )}
          {results.map(pc => (
            <button
              key={`${pc.labId}-${pc.id}`}
              onClick={() => handleSelect(pc)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b',
                dark
                  ? 'border-dark-borderSub hover:bg-dark-surfaceAlt'
                  : 'border-slate-50 hover:bg-slate-50'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                dark ? 'bg-dark-surfaceAlt' : 'bg-slate-100'
              )}>
                <Monitor size={13} style={{ color: STATUS_HEX[pc.status] }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-mono text-[12px] font-semibold', dark ? 'text-slate-200' : 'text-slate-800')}>
                    PC-{String(pc.num).padStart(2, '0')}
                  </span>
                  <span className={cn('text-[11px]', dark ? 'text-slate-500' : 'text-slate-400')}>
                    {pc.labName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge color={STATUS_HEX[pc.status]} bg={STATUS_BG_HEX[pc.status]}>
                    {STATUS_META[pc.status].label}
                  </Badge>
                  <span className="text-[10px] font-medium" style={{ color: COND_HEX[pc.condition] }}>
                    {COND_META[pc.condition].label}
                  </span>
                  <span className={cn('text-[10px]', dark ? 'text-slate-600' : 'text-slate-400')}>
                    · {pc.lastStudent}
                  </span>
                </div>
              </div>
              <span className={cn('text-[10px] flex-shrink-0', dark ? 'text-slate-600' : 'text-slate-400')}>
                {pc.specs.cpu.split(' ').slice(0,3).join(' ')}
              </span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className={cn(
          'flex items-center gap-4 px-4 py-2 border-t text-[10px]',
          dark ? 'border-dark-border text-slate-600' : 'border-slate-100 text-slate-400'
        )}>
          <span><kbd className="font-mono">↵</kbd> Select</span>
          <span><kbd className="font-mono">Esc</kbd> Close</span>
          <span className="ml-auto">{results.length > 0 ? `${results.length} result${results.length > 1 ? 's' : ''}` : ''}</span>
        </div>
      </div>
    </div>
  )
}
