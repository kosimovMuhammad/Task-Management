import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Bold,
  CheckCircle2,
  Download,
  FolderKanban,
  Italic,
  List,
  ListTodo,
  Plus,
  PlusCircle,
  Search,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { downloadCsv } from '@/lib/csvExport'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import { cn } from '@/lib/utils'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PriorityIcon } from '@/components/shared/PriorityIcon'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspaceMembers } from '@/features/workspace/workspaceMembersSlice'
import { fetchProjectMembers } from '@/features/project/projectMembersSlice'
import { fetchLabels } from '@/features/label/labelSlice'
import { createIssue } from '@/features/issue/issueSlice'
import type { Issue, IssueListResponse, IssuePriority } from '@/types/issue'
import type { IssueState } from '@/types/state'
import type { Project } from '@/types/project'

const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none']
const UNASSIGNED = 'unassigned'

function DescriptionToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
}) {
  const wrapSelection = (marker: string) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const next = `${value.slice(0, start)}${marker}${value.slice(start, end)}${marker}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + marker.length, end + marker.length)
    })
  }

  const prefixLine = (prefix: string) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length)
    })
  }

  return (
    <div className="flex items-center gap-0.5 rounded-t-lg border border-b-0 border-input px-1.5 py-1">
      <button
        type="button"
        onClick={() => wrapSelection('**')}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Bold"
      >
        <Bold className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => wrapSelection('*')}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Italic"
      >
        <Italic className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => prefixLine('- ')}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="List"
      >
        <List className="size-3.5" />
      </button>
    </div>
  )
}

function useGreeting() {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  if (hour < 12) return t('dashboard.goodMorning')
  if (hour < 18) return t('dashboard.goodAfternoon')
  return t('dashboard.goodEvening')
}

interface ScopedIssue extends Issue {
  project: Project
}

// Pulls every issue + state across all of the workspace's projects so stats/chart/activity can be
// computed client-side — there is no workspace-wide stats/activity endpoint on the backend yet.
function useWorkspaceIssues(workspaceSlug: string, projects: Project[], projectsLoading: boolean) {
  const [issues, setIssues] = useState<ScopedIssue[] | null>(null)
  const [statesById, setStatesById] = useState<Map<string, IssueState>>(new Map())

  useEffect(() => {
    if (projectsLoading) return
    if (projects.length === 0) {
      setIssues([])
      setStatesById(new Map())
      return
    }
    let cancelled = false
    setIssues(null)

    Promise.all(
      projects.map((project) =>
        Promise.all([
          apiClient.get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${project.id}/issues/`, {
            params: { limit: 100 },
          }),
          apiClient.get<IssueState[]>(`/workspaces/${workspaceSlug}/projects/${project.id}/states/`),
        ]).then(([issuesRes, statesRes]) => ({ project, issues: issuesRes.data.data, states: statesRes.data })),
      ),
    )
      .then((results) => {
        if (cancelled) return
        const nextStates = new Map<string, IssueState>()
        const nextIssues: ScopedIssue[] = []
        for (const result of results) {
          for (const state of result.states) nextStates.set(state.id, state)
          for (const issue of result.issues) nextIssues.push({ ...issue, project: result.project })
        }
        setStatesById(nextStates)
        setIssues(nextIssues)
      })
      .catch(() => {
        if (!cancelled) {
          setIssues([])
          setStatesById(new Map())
        }
      })

    return () => {
      cancelled = true
    }
  }, [workspaceSlug, projects, projectsLoading])

  return { issues, statesById }
}

function StatCard({
  icon: Icon,
  colorClass,
  label,
  value,
  isLoading,
}: {
  icon: typeof ListTodo
  colorClass: string
  label: string
  value: number
  isLoading: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className={cn('mb-3 flex size-9 items-center justify-center rounded-md', colorClass)}>
        <Icon className="size-4" />
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-12" />
      ) : (
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      )}
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  )
}

function QuickCreateTaskDialog({
  workspaceSlug,
  projects,
  trigger,
}: {
  workspaceSlug: string
  projects: Project[]
  trigger: ReactElement
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const labels = useAppSelector((state) => state.label.items)
  const projectMembers = useAppSelector((state) => state.projectMembers.items)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [states, setStates] = useState<IssueState[]>([])
  const [statesLoading, setStatesLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stateId, setStateId] = useState('')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [estimate, setEstimate] = useState('')
  const [labelIds, setLabelIds] = useState<string[]>([])
  const [assigneeId, setAssigneeId] = useState(UNASSIGNED)
  const [parentQuery, setParentQuery] = useState('')
  const [parentResults, setParentResults] = useState<Issue[]>([])
  const [parentIssue, setParentIssue] = useState<Issue | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open && !projectId && projects.length > 0) setProjectId(projects[0].id)
  }, [open, projectId, projects])

  useEffect(() => {
    if (!projectId) return
    setStatesLoading(true)
    apiClient
      .get<IssueState[]>(`/workspaces/${workspaceSlug}/projects/${projectId}/states/`)
      .then((res) => {
        setStates(res.data)
        setStateId(res.data.find((s) => s.is_default)?.id ?? res.data[0]?.id ?? '')
      })
      .finally(() => setStatesLoading(false))
    void dispatch(fetchLabels({ workspaceSlug, projectId }))
    void dispatch(fetchProjectMembers({ workspaceSlug, projectId }))
    setLabelIds([])
    setParentIssue(null)
    setParentQuery('')
  }, [workspaceSlug, projectId, dispatch])

  useEffect(() => {
    if (user && projectMembers.some((m) => m.user_id === user.id)) setAssigneeId(user.id)
  }, [user, projectMembers])

  useEffect(() => {
    if (!projectId || !parentQuery.trim()) {
      setParentResults([])
      return
    }
    const handle = setTimeout(() => {
      apiClient
        .get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, {
          params: { search: parentQuery, limit: 5 },
        })
        .then((res) => setParentResults(res.data.data))
    }, 300)
    return () => clearTimeout(handle)
  }, [workspaceSlug, projectId, parentQuery])

  const toggleLabel = (labelId: string) => {
    setLabelIds((ids) => (ids.includes(labelId) ? ids.filter((id) => id !== labelId) : [...ids, labelId]))
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPriority('medium')
    setEstimate('')
    setLabelIds([])
    setAssigneeId(UNASSIGNED)
    setParentIssue(null)
    setParentQuery('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!projectId || !stateId) return
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(
        createIssue({
          workspaceSlug,
          projectId,
          payload: {
            title,
            description: description.trim() || undefined,
            state_id: stateId,
            priority,
            parent_id: parentIssue?.id ?? undefined,
            assignee_ids: assigneeId !== UNASSIGNED ? [assigneeId] : undefined,
            label_ids: labelIds.length > 0 ? labelIds : undefined,
            estimate_points: estimate.trim() ? Number(estimate) : undefined,
          },
        }),
      ).unwrap()
      setOpen(false)
      resetForm()
    } catch {
      setError(t('issues.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (projects.length === 0) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('issues.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="quick-task-title" className="text-sm font-medium">
              {t('issues.titleField')}
            </label>
            <Input id="quick-task-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('issues.descriptionField')}</label>
            <DescriptionToolbar textareaRef={descriptionRef} value={description} onChange={setDescription} />
            <Textarea
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 rounded-t-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('dashboard.project')}</label>
              <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string) => projects.find((p) => p.id === v)?.name ?? v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('issueDetail.estimate')}</label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('issues.state')}</label>
              <Select
                value={stateId}
                onValueChange={(v) => v && setStateId(v)}
                disabled={statesLoading || states.length === 0}
              >
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
                  <SelectValue>
                    {(v: IssuePriority) => (
                      <span className="flex items-center gap-1.5">
                        <PriorityIcon priority={v} />
                        {t(`priority.${v}`)}
                      </span>
                    )}
                  </SelectValue>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('issueDetail.labels')}</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {labelIds.map((id) => {
                  const label = labels.find((l) => l.id === id)
                  if (!label) return null
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                    >
                      {label.name}
                      <button type="button" onClick={() => toggleLabel(id)} aria-label={t('common.delete')}>
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
                <Select value={labelIds} onValueChange={(v) => setLabelIds(v ?? [])} multiple>
                  <SelectTrigger size="sm" className="gap-1 px-2 text-xs">
                    <Plus className="size-3" />
                    {t('issues.addLabel')}
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('issues.assignee')}</label>
              <Select value={assigneeId} onValueChange={(v) => v && setAssigneeId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string) => projectMembers.find((m) => m.user_id === v)?.user.display_name ?? t('issues.unassigned')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>{t('issues.unassigned')}</SelectItem>
                  {projectMembers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.user.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative space-y-1.5">
            <label className="text-sm font-medium">{t('issues.parentIssue')}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={parentIssue ? parentIssue.title : parentQuery}
                onChange={(e) => {
                  setParentIssue(null)
                  setParentQuery(e.target.value)
                }}
                placeholder={t('issues.parentSearchPlaceholder')}
                className="pl-8"
              />
            </div>
            {!parentIssue && parentQuery.trim() && parentResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                {parentResults.map((issue) => (
                  <button
                    type="button"
                    key={issue.id}
                    className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setParentIssue(issue)
                      setParentQuery('')
                    }}
                  >
                    {issue.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !stateId}>
              {isSubmitting ? t('common.loading') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const DAY_MS = 86400000

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const projects = useAppSelector((state) => state.project.items)
  const projectsLoading = useAppSelector((state) => state.project.isLoading)
  const members = useAppSelector((state) => state.workspaceMembers.items)
  const greeting = useGreeting()
  const { issues, statesById } = useWorkspaceIssues(workspaceSlug ?? '', projects, projectsLoading)

  useEffect(() => {
    if (workspaceSlug) void dispatch(fetchWorkspaceMembers(workspaceSlug))
  }, [workspaceSlug, dispatch])

  const membersById = useMemo(() => new Map(members.map((m) => [m.user_id, m.user])), [members])

  const today = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const stats = useMemo(() => {
    if (!issues) return null
    const now = Date.now()
    const sevenDaysAgo = now - 7 * DAY_MS
    let inProgress = 0
    let overdue = 0
    let completedThisWeek = 0
    let assignedToMe = 0
    for (const issue of issues) {
      const group = statesById.get(issue.state_id)?.group
      if (group === 'started') inProgress++
      if (issue.due_date && group !== 'completed' && group !== 'cancelled' && Date.parse(issue.due_date) < now) {
        overdue++
      }
      if (issue.completed_at && Date.parse(issue.completed_at) >= sevenDaysAgo) completedThisWeek++
      if (user && issue.assignees.some((a) => a.id === user.id)) assignedToMe++
    }
    return { inProgress, overdue, completedThisWeek, assignedToMe }
  }, [issues, statesById, user])

  // 10 three-day buckets covering the last 30 days, counted by real `completed_at` timestamps.
  const trend = useMemo(() => {
    const buckets: { start: Date; count: number }[] = []
    for (let i = 9; i >= 0; i--) {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - i * 3 - 2)
      buckets.push({ start, count: 0 })
    }
    if (!issues) return buckets
    for (const issue of issues) {
      if (!issue.completed_at) continue
      const completedAt = Date.parse(issue.completed_at)
      for (const bucket of buckets) {
        const bucketStart = bucket.start.getTime()
        if (completedAt >= bucketStart && completedAt < bucketStart + 3 * DAY_MS) {
          bucket.count++
          break
        }
      }
    }
    return buckets
  }, [issues])
  const trendMax = Math.max(1, ...trend.map((b) => b.count))

  const upcoming = useMemo(() => {
    if (!issues) return []
    const now = Date.now()
    return issues
      .filter((issue) => {
        if (!issue.due_date) return false
        const group = statesById.get(issue.state_id)?.group
        return group !== 'completed' && group !== 'cancelled' && Date.parse(issue.due_date) >= now
      })
      .sort((a, b) => Date.parse(a.due_date!) - Date.parse(b.due_date!))
      .slice(0, 5)
  }, [issues, statesById])

  const activityRows = useMemo(() => {
    if (!issues) return []
    const rows: { id: string; type: 'created' | 'completed'; issue: ScopedIssue; at: string }[] = []
    for (const issue of issues) {
      rows.push({ id: `${issue.id}-created`, type: 'created', issue, at: issue.created_at })
      if (issue.completed_at) rows.push({ id: `${issue.id}-completed`, type: 'completed', issue, at: issue.completed_at })
    }
    return rows.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 8)
  }, [issues])

  const handleExport = () => {
    if (!issues) return
    downloadCsv(
      `dashboard-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Project', 'Issue', 'Title', 'State', 'Priority', 'Assignees', 'Due Date', 'Updated At'],
      issues.map((issue) => [
        issue.project.identifier,
        `${issue.project.identifier}-${issue.sequence_id}`,
        issue.title,
        statesById.get(issue.state_id)?.name ?? '',
        issue.priority,
        issue.assignees.map((a) => a.display_name).join('; '),
        issue.due_date ?? '',
        issue.updated_at,
      ]),
    )
  }

  const firstProjectId = projects[0]?.id
  const inviteHref = workspaceSlug
    ? firstProjectId
      ? `/w/${workspaceSlug}/p/${firstProjectId}/settings/members`
      : `/w/${workspaceSlug}/projects`
    : '#'

  if (!workspaceSlug) return null

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {greeting}, {user?.display_name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} disabled={!issues || issues.length === 0}>
            <Download className="size-4" />
            {t('dashboard.exportReport')}
          </Button>
          <QuickCreateTaskDialog
            workspaceSlug={workspaceSlug}
            projects={projects}
            trigger={
              <Button disabled={projects.length === 0}>
                <PlusCircle className="size-4" />
                {t('dashboard.newTask')}
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ListTodo}
          colorClass="bg-blue-500/15 text-blue-500"
          label={t('dashboard.stats.inProgress')}
          value={stats?.inProgress ?? 0}
          isLoading={!stats}
        />
        <StatCard
          icon={AlertTriangle}
          colorClass="bg-red-500/15 text-red-500"
          label={t('dashboard.stats.overdue')}
          value={stats?.overdue ?? 0}
          isLoading={!stats}
        />
        <StatCard
          icon={CheckCircle2}
          colorClass="bg-emerald-500/15 text-emerald-500"
          label={t('dashboard.stats.completedThisWeek')}
          value={stats?.completedThisWeek ?? 0}
          isLoading={!stats}
        />
        <StatCard
          icon={UserRound}
          colorClass="bg-violet-500/15 text-violet-500"
          label={t('dashboard.stats.assignedToMe')}
          value={stats?.assignedToMe ?? 0}
          isLoading={!stats}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{t('dashboard.trend.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('dashboard.trend.subtitle')}</p>
            </div>
            <span className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              {t('dashboard.trend.last30Days')}
            </span>
          </div>
          {!issues ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div className="flex h-40 items-end gap-2">
                {trend.map((bucket, i) => (
                  <div
                    key={i}
                    className="group relative flex-1 rounded-t bg-primary/70 transition-colors hover:bg-primary"
                    style={{ height: `${Math.max(3, (bucket.count / trendMax) * 100)}%` }}
                    title={`${bucket.start.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}: ${bucket.count}`}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{trend[0].start.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}</span>
                <span>
                  {trend[Math.floor(trend.length / 2)].start.toLocaleDateString(i18n.language, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>
                  {new Date().toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">{t('dashboard.quickActions.title')}</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickCreateTaskDialog
                workspaceSlug={workspaceSlug}
                projects={projects}
                trigger={
                  <button
                    disabled={projects.length === 0}
                    className="flex flex-col items-center gap-1.5 rounded-md border border-border p-3 text-xs font-medium hover:border-primary hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
                  >
                    <PlusCircle className="size-4 text-primary" />
                    {t('dashboard.quickActions.newTask')}
                  </button>
                }
              />
              <Link
                to={`/w/${workspaceSlug}/projects`}
                className="flex flex-col items-center gap-1.5 rounded-md border border-border p-3 text-xs font-medium hover:border-primary hover:bg-secondary"
              >
                <FolderKanban className="size-4 text-primary" />
                {t('dashboard.quickActions.newProject')}
              </Link>
              <Link
                to={inviteHref}
                className="flex flex-col items-center gap-1.5 rounded-md border border-border p-3 text-xs font-medium hover:border-primary hover:bg-secondary"
              >
                <UserPlus className="size-4 text-primary" />
                {t('dashboard.quickActions.invite')}
              </Link>
              <button
                onClick={handleExport}
                disabled={!issues || issues.length === 0}
                className="flex flex-col items-center gap-1.5 rounded-md border border-border p-3 text-xs font-medium hover:border-primary hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
              >
                <Sparkles className="size-4 text-primary" />
                {t('dashboard.quickActions.exportReport')}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{t('dashboard.upcoming.title')}</h2>
              {workspaceSlug && projects[0] && (
                <Link
                  to={`/w/${workspaceSlug}/p/${projects[0].id}/issues`}
                  className="text-xs text-primary hover:underline"
                >
                  {t('dashboard.viewAll')}
                </Link>
              )}
            </div>
            {!issues ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.upcoming.empty')}</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      to={`/w/${workspaceSlug}/p/${issue.project_id}/issues/${issue.id}`}
                      className="flex items-start gap-2.5 hover:text-primary"
                    >
                      <PriorityIcon priority={issue.priority} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {issue.project.name} ·{' '}
                          {new Date(issue.due_date!).toLocaleDateString(i18n.language, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-semibold">{t('dashboard.activity.title')}</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dashboard.activity.columns.activity')}</TableHead>
              <TableHead>{t('dashboard.activity.columns.user')}</TableHead>
              <TableHead>{t('dashboard.activity.columns.task')}</TableHead>
              <TableHead>{t('dashboard.activity.columns.time')}</TableHead>
              <TableHead className="text-right">{t('dashboard.activity.columns.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!issues &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {issues && activityRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            )}
            {activityRows.map((row) => {
              const state = statesById.get(row.issue.state_id)
              const authorId = row.type === 'completed' ? row.issue.assignees[0]?.id : row.issue.created_by_id
              const authorName =
                (authorId && (membersById.get(authorId)?.display_name ?? row.issue.assignees[0]?.display_name)) ??
                '—'
              return (
                <TableRow key={row.id}>
                  <TableCell className="flex items-center gap-2">
                    {row.type === 'created' ? (
                      <PlusCircle className="size-3.5 text-blue-500" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                    )}
                    {t(`dashboard.activity.${row.type}`)}
                  </TableCell>
                  <TableCell>{authorName}</TableCell>
                  <TableCell>
                    <Link
                      to={`/w/${workspaceSlug}/p/${row.issue.project_id}/issues/${row.issue.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {row.issue.project.identifier}-{row.issue.sequence_id} {row.issue.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatRelativeTime(row.at, i18n.language)}</TableCell>
                  <TableCell className="text-right">
                    {state && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: state.color }} />
                        {state.name}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
