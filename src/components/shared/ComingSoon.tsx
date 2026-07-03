import { Clock } from 'lucide-react'

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background text-center text-foreground p-8">
      <div className="flex size-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
        <Clock className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">This view is not available yet. We're working on it.</p>
    </div>
  )
}
