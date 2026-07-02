import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { createCycle, fetchCycles } from '@/features/cycle/cycleSlice'
import { apiClient } from '@/lib/apiClient'
import type { Cycle } from '@/types/cycle'
import type { IssueListResponse } from '@/types/issue'

function daysRemaining(endDate: string | null) {
  if (!endDate) return null
  const diff = Date.parse(endDate) - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function CreateCycleDialog({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(
        createCycle({
          workspaceSlug,
          projectId,
          payload: {
            name,
            description,
            start_date: startDate ? new Date(startDate).toISOString() : undefined,
            end_date: endDate ? new Date(endDate).toISOString() : undefined,
          },
        }),
      ).unwrap()
      setOpen(false)
      setName('')
      setDescription('')
      setStartDate('')
      setEndDate('')
    } catch {
      setError(t('cycles.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            {t('cycles.create')}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('cycles.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="cycle-name" className="text-sm font-medium">
              {t('cycles.name')}
            </label>
            <Input id="cycle-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cycle-description" className="text-sm font-medium">
              {t('projects.description')}
            </label>
            <Textarea id="cycle-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="cycle-start" className="text-sm font-medium">
                {t('cycles.startDate')}
              </label>
              <Input id="cycle-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cycle-end" className="text-sm font-medium">
                {t('cycles.endDate')}
              </label>
              <Input id="cycle-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

function useIssueCount(workspaceSlug: string, projectId: string, cycleId: string | undefined) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!cycleId) return
    let cancelled = false
    apiClient
      .get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, {
        params: { cycle: cycleId },
      })
      .then((res) => {
        if (!cancelled) setCount(res.data.data.length)
      })
      .catch(() => {
        if (!cancelled) setCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceSlug, projectId, cycleId])

  return count
}

function ActiveCycleCard({ cycle, workspaceSlug, projectId }: { cycle: Cycle; workspaceSlug: string; projectId: string }) {
  const { t } = useTranslation()
  const issueCount = useIssueCount(workspaceSlug, projectId, cycle.id)
  const progress = cycle.progress ?? 0

  return (
    <div className="rounded-lg border border-primary/40 bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{cycle.name}</h3>
        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
          {t(`cycles.status.${cycle.status}`)}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {cycle.start_date && new Date(cycle.start_date).toLocaleDateString()} –{' '}
        {cycle.end_date && new Date(cycle.end_date).toLocaleDateString()}
      </p>
      {cycle.description && <p className="mb-4 text-sm text-muted-foreground">{cycle.description}</p>}
      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('cycles.progress')}</span>
        <span>{progress}%</span>
      </div>
      <ProgressBar value={progress} />
      {issueCount !== null && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t('cycles.issues')}: {issueCount}
        </p>
      )}
    </div>
  )
}

export default function CyclesOverviewPage() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const dispatch = useAppDispatch()
  const cycles = useAppSelector((state) => state.cycle.items)
  const isLoading = useAppSelector((state) => state.cycle.isLoading)

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    void dispatch(fetchCycles({ workspaceSlug, projectId }))
  }, [workspaceSlug, projectId, dispatch])

  const { active, upcoming, completed } = useMemo(() => {
    return {
      active: cycles.find((c) => c.status === 'active'),
      upcoming: cycles.filter((c) => c.status === 'upcoming' || c.status === 'draft'),
      completed: cycles
        .filter((c) => c.status === 'completed')
        .sort((a, b) => Date.parse(b.end_date ?? '') - Date.parse(a.end_date ?? '')),
    }
  }, [cycles])

  if (!workspaceSlug || !projectId) return null

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('cycles.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('cycles.subtitle')}</p>
        </div>
        <CreateCycleDialog workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">{t('cycles.empty')}</p>
        </div>
      ) : (
        <>
          {active && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('cycles.activeCycle')}</h2>
              <ActiveCycleCard cycle={active} workspaceSlug={workspaceSlug} projectId={projectId} />
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('cycles.upcomingCycles')}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {upcoming.map((cycle) => {
                  const remaining = daysRemaining(cycle.end_date)
                  return (
                    <div key={cycle.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-sm font-medium">{cycle.name}</h3>
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] uppercase text-secondary-foreground">
                          {t(`cycles.status.${cycle.status}`)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {cycle.start_date && new Date(cycle.start_date).toLocaleDateString()} –{' '}
                        {cycle.end_date && new Date(cycle.end_date).toLocaleDateString()}
                      </p>
                      {remaining !== null && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t('cycles.daysRemaining', { count: remaining })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('cycles.recentlyCompleted')}</h2>
              <div className="divide-y divide-border rounded-lg border border-border">
                {completed.map((cycle) => (
                  <div key={cycle.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{cycle.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cycle.start_date && new Date(cycle.start_date).toLocaleDateString()} –{' '}
                          {cycle.end_date && new Date(cycle.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {cycle.progress != null && (
                      <span className="text-sm text-muted-foreground">{cycle.progress}%</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
