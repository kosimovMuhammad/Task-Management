import { Signal, SignalHigh, SignalLow, SignalMedium, SignalZero } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IssuePriority } from '@/types/issue'

const PRIORITY_ICON: Record<IssuePriority, typeof Signal> = {
  urgent: Signal,
  high: SignalHigh,
  medium: SignalMedium,
  low: SignalLow,
  none: SignalZero,
}

const PRIORITY_COLOR: Record<IssuePriority, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
  low: 'text-blue-500',
  none: 'text-muted-foreground',
}

export function PriorityIcon({ priority, className }: { priority: IssuePriority; className?: string }) {
  const Icon = PRIORITY_ICON[priority]
  return <Icon className={cn('size-4', PRIORITY_COLOR[priority], className)} />
}
