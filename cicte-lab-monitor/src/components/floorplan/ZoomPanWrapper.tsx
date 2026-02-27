import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ─── Responsive zoom / pan wrapper for the floor-plan canvas ────────────── */

interface Props {
  /** Fixed width of the inner canvas (px) */
  canvasW: number
  /** Fixed height of the inner canvas (px) */
  canvasH: number
  /** Is dark mode on? */
  dark: boolean
  children: ReactNode
}

const MIN_ZOOM  = 0.35
const MAX_ZOOM  = 2.0
const ZOOM_STEP = 0.15

export function ZoomPanWrapper({ canvasW, canvasH, dark, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom]     = useState(1)
  const [pan, setPan]       = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const lastPinchDist = useRef<number | null>(null)

  /* ── Auto-fit: scale down on mount & resize to fit container width ── */

  const autoFit = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const containerW = el.clientWidth
    const idealZoom = Math.min(containerW / canvasW, 1)
    setZoom(Math.max(idealZoom, MIN_ZOOM))
    setPan({ x: 0, y: 0 })
  }, [canvasW])

  useEffect(() => {
    autoFit()
    const ro = new ResizeObserver(autoFit)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [autoFit])

  /* ── Wheel zoom ────────────────────────────────────────────────────── */

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * 0.003)))
    }
  }, [])

  /* ── Middle-button / two-finger pan ────────────────────────────────── */

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Middle button or touch with two fingers triggers pan
    if (e.button === 1 || (e.pointerType === 'touch' && e.isPrimary === false)) {
      e.preventDefault()
      setIsPanning(true)
      lastPointer.current = { x: e.clientX, y: e.clientY }
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return
    const dx = e.clientX - lastPointer.current.x
    const dy = e.clientY - lastPointer.current.y
    lastPointer.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }, [isPanning])

  const onPointerUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  /* ── Touch pinch-to-zoom ───────────────────────────────────────────── */

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current
        setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z + delta * 0.005)))
      }
      lastPinchDist.current = dist
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    lastPinchDist.current = null
  }, [])

  /* ── Zoom controls ─────────────────────────────────────────────────── */

  const zoomIn  = () => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))
  const zoomOut = () => setZoom(z => Math.max(MIN_ZOOM, z - ZOOM_STEP))
  const zoomPct = Math.round(zoom * 100)

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className={cn(
        'absolute top-2 right-2 z-30 flex items-center gap-1 rounded-lg px-1 py-0.5 border text-[11px]',
        dark
          ? 'bg-dark-surface/90 border-dark-border text-slate-400'
          : 'bg-white/90 border-slate-200 text-slate-500',
      )}>
        <button onClick={zoomOut} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" title="Zoom out">−</button>
        <button onClick={autoFit} className="px-1.5 min-w-[40px] text-center hover:bg-white/10 rounded transition-colors" title="Fit to view">
          {zoomPct}%
        </button>
        <button onClick={zoomIn} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" title="Zoom in">+</button>
      </div>

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="overflow-auto rounded-2xl"
        style={{
          maxHeight: '80vh',
          cursor: isPanning ? 'grabbing' : undefined,
        }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            width:  canvasW * zoom,
            height: canvasH * zoom,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          <div
            style={{
              width: canvasW,
              height: canvasH,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
