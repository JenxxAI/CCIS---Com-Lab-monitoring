import type { DragState } from './constants'

interface Props {
  drag: DragState | null
  guideColor: string
}

export function AlignmentOverlay({ drag, guideColor }: Props) {
  if (!drag) return null

  return (
    <>
      {/* Alignment guides */}
      {drag.guides.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" style={{ overflow: 'visible' }}>
          {drag.guides.map((g, i) => (
            g.type === 'v'
              ? <line key={i} x1={g.pos} y1={g.from} x2={g.pos} y2={g.to}
                  stroke={guideColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
              : <line key={i} x1={g.from} y1={g.pos} x2={g.to} y2={g.pos}
                  stroke={guideColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
          ))}
        </svg>
      )}

      {/* Distance labels */}
      {drag.dists.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {drag.dists.map((d, i) => (
            <div
              key={i}
              className="absolute flex items-center justify-center"
              style={{
                left: d.x - 14, top: d.y - 6,
                width: 28, height: 14,
                background: guideColor,
                borderRadius: 3,
                fontSize: 8,
                fontWeight: 700,
                color: '#fff',
                letterSpacing: 0.3,
                lineHeight: 1,
              }}
            >
              {d.dist}px
            </div>
          ))}
        </div>
      )}
    </>
  )
}
