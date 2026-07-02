import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PriorityIcon } from '@/components/shared/PriorityIcon'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchStates } from '@/features/state/stateSlice'
import { createIssue, fetchIssues, updateIssue } from '@/features/issue/issueSlice'
import type { Issue, IssuePriority } from '@/types/issue'

const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none']

function CreateIssueDialog({
  workspaceSlug,
  projectId,
  defaultStateId,
}: {
  workspaceSlug: string
  projectId: string
  defaultStateId: string
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const states = useAppSelector((state) => state.state.items)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [stateId, setStateId] = useState(defaultStateId)
  const [priority, setPriority] = useState<IssuePriority>('none')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(
        createIssue({ workspaceSlug, projectId, payload: { title, state_id: stateId, priority } }),
      ).unwrap()
      setOpen(false)
      setTitle('')
      void dispatch(fetchIssues({ workspaceSlug, projectId }))
    } catch {
      setError(t('issues.createError'))
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
            {t('issues.newIssue')}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('issues.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="issue-title" className="text-sm font-medium">
              {t('issues.titleField')}
            </label>
            <Input id="issue-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('issues.state')}</label>
              <Select value={stateId} onValueChange={(v) => v && setStateId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string) => states.find((s) => s.id === v)?.name ?? v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('issues.priority')}</label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v as IssuePriority)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: IssuePriority) => t(`priority.${v}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || states.length === 0}>
              {isSubmitting ? t('common.loading') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function IssueCard({
  issue,
  workspaceSlug,
  projectId,
  identifier,
}: {
  issue: Issue
  workspaceSlug: string
  projectId: string
  identifier: string
}) {
  const dispatch = useAppDispatch()
  const states = useAppSelector((state) => state.state.items)

  return (
    <Link
      to={`/w/${workspaceSlug}/p/${projectId}/issues/${issue.id}`}
      className="block space-y-2 rounded-lg border border-border bg-card p-3 hover:border-primary"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {identifier}-{issue.sequence_id}
        </span>
        <PriorityIcon priority={issue.priority} />
      </div>
      <p className="text-sm font-medium">{issue.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {issue.labels.map((label) => (
            <span
              key={label.id}
              className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground"
            >
              {label.name}
            </span>
          ))}
        </div>
        <select
          value={issue.state_id}
          onClick={(e) => e.preventDefault()}
          onChange={(e) => {
            void dispatch(
              updateIssue({ workspaceSlug, projectId, issueId: issue.id, payload: { state_id: e.target.value } }),
            )
          }}
          className="rounded border border-input bg-transparent text-[11px] text-muted-foreground"
        >
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </Link>
  )
}

export default function IssuesListPage() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const dispatch = useAppDispatch()
  const states = useAppSelector((state) => state.state.items)
  const statesLoading = useAppSelector((state) => state.state.isLoading)
  const issues = useAppSelector((state) => state.issue.items)
  const issuesLoading = useAppSelector((state) => state.issue.isLoading)
  const project = useAppSelector((s) => s.project.items.find((p) => p.id === projectId))
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority | 'all'>('all')

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    void dispatch(fetchStates({ workspaceSlug, projectId }))
  }, [workspaceSlug, projectId, dispatch])

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    const handle = setTimeout(() => {
      void dispatch(
        fetchIssues({
          workspaceSlug,
          projectId,
          filters: {
            search: search || undefined,
            priority: priorityFilter === 'all' ? undefined : priorityFilter,
          },
        }),
      )
    }, 300)
    return () => clearTimeout(handle)
  }, [workspaceSlug, projectId, search, priorityFilter, dispatch])

  const columns = useMemo(() => {
    return [...states]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ state: s, issues: issues.filter((i) => i.state_id === s.id) }))
  }, [states, issues])

  if (!workspaceSlug || !projectId) return null

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('issues.searchPlaceholder')}
            className="h-9 w-64 pl-8"
          />
        </div>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v as IssuePriority | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(v: IssuePriority | 'all') => (v === 'all' ? t('issues.allPriorities') : t(`priority.${v}`))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('issues.allPriorities')}</SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`priority.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {states.length > 0 && (
          <CreateIssueDialog
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            defaultStateId={states.find((s) => s.is_default)?.id ?? states[0].id}
          />
        )}
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        {statesLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-lg" />
            ))}
          </div>
        ) : states.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('issues.noIssues')}</p>
        ) : (
          <div className="flex gap-4">
            {columns.map(({ state, issues: stateIssues }) => (
              <div key={state.id} className="w-72 shrink-0 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: state.color }} />
                  <h3 className="text-sm font-medium">{state.name}</h3>
                  <span className="rounded bg-secondary px-1.5 text-xs text-secondary-foreground">
                    {stateIssues.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {issuesLoading && stateIssues.length === 0 ? (
                    <Skeleton className="h-20 rounded-lg" />
                  ) : (
                    stateIssues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        workspaceSlug={workspaceSlug}
                        projectId={projectId}
                        identifier={project?.identifier ?? ''}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
