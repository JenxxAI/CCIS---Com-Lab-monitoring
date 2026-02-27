/* ─── Minimalist SVG icons ────────────────────────────────────────────────── */

export function FurnIcon({ type, color }: { type: string; color: string }) {
  const s = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'table': return (
      <svg {...s}><rect x="3" y="4" width="18" height="6" rx="1.5" /><line x1="5" y1="10" x2="5" y2="20" /><line x1="19" y1="10" x2="19" y2="20" /><line x1="3" y1="14" x2="21" y2="14" /></svg>
    )
    case 'door': return (
      <svg {...s}><rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="16" cy="12" r="1.2" fill={color} /><line x1="4" y1="22" x2="20" y2="22" /></svg>
    )
    case 'aircon': return (
      <svg {...s}><rect x="2" y="4" width="20" height="10" rx="2" /><path d="M6 14v3c0 1-1 2-2 3" /><path d="M12 14v4" /><path d="M18 14v3c0 1 1 2 2 3" /><line x1="5" y1="9" x2="19" y2="9" /></svg>
    )
    case 'server': return (
      <svg {...s}><rect x="3" y="2" width="18" height="7" rx="1.5" /><rect x="3" y="11" width="18" height="7" rx="1.5" /><circle cx="7" cy="5.5" r="1" fill={color} /><circle cx="7" cy="14.5" r="1" fill={color} /><line x1="11" y1="5.5" x2="17" y2="5.5" /><line x1="11" y1="14.5" x2="17" y2="14.5" /><line x1="3" y1="20" x2="8" y2="22" /><line x1="21" y1="20" x2="16" y2="22" /></svg>
    )
    case 'router': return (
      <svg {...s}><rect x="2" y="12" width="20" height="8" rx="2" /><circle cx="6" cy="16" r="1" fill={color} /><circle cx="10" cy="16" r="1" fill={color} /><line x1="8" y1="12" x2="6" y2="4" /><line x1="16" y1="12" x2="18" y2="4" /><line x1="12" y1="12" x2="12" y2="6" /></svg>
    )
    case 'wifi': return (
      <svg {...s}><path d="M2 8.5a16 16 0 0 1 20 0" /><path d="M5.5 12a10.5 10.5 0 0 1 13 0" /><path d="M9 15.5a5 5 0 0 1 6 0" /><circle cx="12" cy="19" r="1.2" fill={color} /></svg>
    )
    case 'smarttv': return (
      <svg {...s}><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /><polyline points="7 10 10 8 13 11 17 7" /></svg>
    )
    default: return (
      <svg {...s}><rect x="3" y="3" width="18" height="18" rx="3" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
    )
  }
}

