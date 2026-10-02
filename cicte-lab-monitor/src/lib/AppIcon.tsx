import type { AppInfo } from './appCatalog'
import { cn } from '@/lib/utils'

export function AppIcon({ app, className }: { app: AppInfo; className?: string }) {
  if (app.iconUrl) {
    return (
      <img
        src={app.iconUrl}
        alt={app.name}
        className={cn('object-contain', className)}
        draggable={false}
      />
    )
  }
  if (app.icon) {
    const Icon = app.icon
    return <Icon className={className} />
  }
  return null
}
