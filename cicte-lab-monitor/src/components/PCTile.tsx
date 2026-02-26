import { cn } from '@/lib/utils'
import { STATUS_HEX, STATUS_BG_HEX, COND_HEX } from '@/lib/utils'
import type { PC } from '@/types'

interface PCTileProps {
  pc:         PC
  isSelected: boolean
  dimmed:     boolean
  onSelect:   (pc: PC) => void
  accent:     string   // theme accent hex
}

export function PCTile({ pc, isSelected, dimmed, onSelect, accent }: PCTileProps) {
  const statusColor = STATUS_HEX[pc.status]
  const statusBg    = STATUS_BG_HEX[pc.status]
  const condColor   = COND_HEX[pc.condition]

  return (
    <button
      onClick={() => onSelect(pc)}
      className={cn(
        'relative flex flex-col items-center justify-center gap-[3px] rounded-lg flex-shrink-0',
        'transition-transform duration-[130ms] hover:scale-110 hover:z-10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        dimmed && 'opacity-30 pointer-events-none'
      )}
      style={{
        width:      44,
        height:     38,
        background: dimmed ? 'transparent' : statusBg,
        border:     `1.5px solid ${isSelected ? accent : dimmed ? 'transparent' : statusColor + '55'}`,
        boxShadow:  isSelected
          ? `0 0 0 2px ${accent}, 0 4px 14px ${accent}30`
          : undefined,
      }}
      title={`PC-${String(pc.num).padStart(2,'0')} · ${pc.status} · ${pc.condition}`}
    >
      <span
        className="font-mono text-[8px] font-semibold leading-none"
        style={{ color: dimmed ? '#4a5568' : statusColor }}
      >
        {pc.num}
      </span>
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width:     5,
          height:    5,
          background: condColor,
          boxShadow:  `0 0 4px ${condColor}80`,
        }}
      />
    </button>
  )
}

// Empty placeholder tile (for alignment)
export function PCTilePlaceholder() {
  return <div style={{ width: 44, height: 38, flexShrink: 0 }} />
}
