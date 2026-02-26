import { cn } from '@/lib/utils'

interface BadgeProps {
  color:    string   // hex
  bg:       string   // hex / rgba
  children: React.ReactNode
  size?:    'sm' | 'md'
}

export function Badge({ color, bg, children, size = 'md' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'md' ? 'px-2.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[10px]'
      )}
      style={{ color, background: bg }}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width:      size === 'md' ? 5 : 4,
          height:     size === 'md' ? 5 : 4,
          background: color,
        }}
      />
      {children}
    </span>
  )
}
