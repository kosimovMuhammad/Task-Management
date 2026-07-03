import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Plus, Users } from 'lucide-react'
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
import { PriorityIcon } from '@/components/shared/PriorityIcon'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { createCycle, fetchCycles, addIssuesToCycle, removeIssueFromCycle } from '@/features/cycle/cycleSlice'
import { fetchStates } from '@/features/state/stateSlice'
import { apiClient } from '@/lib/apiClient'
import type { Cycle } from '@/types/cycle'
import type { Issue, IssueListResponse } from '@/types/issue'

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

function useCycleIssues(workspaceSlug: string, projectId: string, cycleId: string | undefined) {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!cycleId) return
    let cancelled = false
    apiClient
      .get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, {
        params: { cycle: cycleId },
      })
      .then((res) => {
        if (!cancelled) setIssues(res.data.data)
      })
      .catch(() => {
        if (!cancelled) setIssues([])
      })
    return () => {
      cancelled = true
    }
  }, [workspaceSlug, projectId, cycleId, reloadKey])

  return { issues, reload: () => setReloadKey((k) => k + 1) }
}

function ManageCycleIssuesDialog({
  workspaceSlug,
  projectId,
  cycle,
  cycleIssueIds,
  onChanged,
}: {
  workspaceSlug: string
  projectId: string
  cycle: Cycle
  cycleIssueIds: Set<string>
  onChanged: () => void
}) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [allIssues, setAllIssues] = useState<Issue[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    apiClient
      .get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, { params: { limit: 100 } })
      .then((res) => setAllIssues(res.data.data))
  }, [open, workspaceSlug, projectId])

  async function toggle(issue: Issue) {
    setPending(issue.id)
    try {
      if (cycleIssueIds.has(issue.id)) {
        await dispatch(removeIssueFromCycle({ workspaceSlug, projectId, cycleId: cycle.id, issueId: issue.id })).unwrap()
      } else {
        await dispatch(addIssuesToCycle({ workspaceSlug, projectId, cycleId: cycle.id, issueIds: [issue.id] })).unwrap()
      }
      onChanged()
    } catch {
      toast.error('Failed to update cycle issues')
    } finally {
      setPending(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Manage Issues</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage issues in "{cycle.name}"</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {!allIssues ? (
            <Skeleton className="h-40 w-full" />
          ) : allIssues.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No issues in this project yet.</p>
          ) : (
            allIssues.map((issue) => {
              const inCycle = cycleIssueIds.has(issue.id)
              return (
                <button
                  key={issue.id}
                  onClick={() => void toggle(issue)}
                  disabled={pending === issue.id}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                >
                  <span className="truncate">{issue.title}</span>
                  <span className={inCycle ? 'text-xs font-medium text-primary' : 'text-xs text-muted-foreground'}>
                    {inCycle ? 'In cycle · remove' : 'Add'}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ActiveCycleCard({ cycle, workspaceSlug, projectId }: { cycle: Cycle; workspaceSlug: string; projectId: string }) {
  const { t } = useTranslation()
  const states = useAppSelector((state) => state.state.items)
  const dispatch = useAppDispatch()
  const { issues, reload } = useCycleIssues(workspaceSlug, projectId, cycle.id)
  const progress = cycle.progress ?? 0

  useEffect(() => {
    void dispatch(fetchStates({ workspaceSlug, projectId }))
  }, [workspaceSlug, projectId, dispatch])

  const cycleIssueIds = useMemo(() => new Set((issues ?? []).map((i) => i.id)), [issues])

  return (
    <div className="rounded-lg border border-primary/40 bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{cycle.name}</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
            {t(`cycles.status.${cycle.status}`)}
          </span>
          <ManageCycleIssuesDialog
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            cycle={cycle}
            cycleIssueIds={cycleIssueIds}
            onChanged={reload}
          />
        </div>
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

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('cycles.issues')}</span>
          <span>{issues?.length ?? '—'}</span>
        </div>
        {issues === null ? (
          <Skeleton className="h-20 w-full" />
        ) : issues.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No issues assigned to this cycle yet.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {issues.slice(0, 8).map((issue) => {
              const state = states.find((s) => s.id === issue.state_id)
              return (
                <Link
                  key={issue.id}
                  to={`/w/${workspaceSlug}/p/${projectId}/issues/${issue.id}`}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted"
                >
                  <PriorityIcon priority={issue.priority} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{issue.title}</span>
                  {state && (
                    <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">
                      {state.name}
                    </span>
                  )}
                  {issue.assignees.length > 0 ? (
                    <span className="shrink-0 text-xs text-muted-foreground">{issue.assignees[0].display_name}</span>
                  ) : (
                    <Users className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </Link>
              )
            })}
          </div>
        )}
        {issues && issues.length > 8 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">+{issues.length - 8} more</p>
        )}
      </div>
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
