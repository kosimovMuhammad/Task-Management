import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import { Skeleton } from '@/components/ui/skeleton'
import { PriorityIcon } from '@/components/shared/PriorityIcon'
import { useAppSelector } from '@/hooks/useAppSelector'
import type { Issue, IssueListResponse } from '@/types/issue'
import type { IssueState } from '@/types/state'
import type { Project } from '@/types/project'

interface ScopedIssue extends Issue {
  project: Project
}

function useMyTasks(workspaceSlug: string, projects: Project[], projectsLoading: boolean, userId: string | undefined) {
  const [issues, setIssues] = useState<ScopedIssue[] | null>(null)
  const [statesById, setStatesById] = useState<Map<string, IssueState>>(new Map())

  useEffect(() => {
    if (projectsLoading || !userId) return
    if (projects.length === 0) {
      setIssues([])
      return
    }
    let cancelled = false
    setIssues(null)

    Promise.all(
      projects.map((project) =>
        Promise.all([
          apiClient.get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${project.id}/issues/`, {
            params: { 'assignee[]': userId, limit: 100 },
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
        if (!cancelled) setIssues([])
      })

    return () => {
      cancelled = true
    }
  }, [workspaceSlug, projects, projectsLoading, userId])

  return { issues, statesById }
}

export default function MyTasksPage() {
  const { t, i18n } = useTranslation()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const user = useAppSelector((state) => state.auth.user)
  const projects = useAppSelector((state) => state.project.items)
  const projectsLoading = useAppSelector((state) => state.project.isLoading)
  const { issues, statesById } = useMyTasks(workspaceSlug ?? '', projects, projectsLoading, user?.id)

  const grouped = useMemo(() => {
    if (!issues) return null
    const open = issues.filter((i) => !i.completed_at)
    const done = issues.filter((i) => i.completed_at)
    open.sort((a, b) => (a.due_date ? Date.parse(a.due_date) : Infinity) - (b.due_date ? Date.parse(b.due_date) : Infinity))
    done.sort((a, b) => Date.parse(b.completed_at!) - Date.parse(a.completed_at!))
    return { open, done }
  }, [issues])

  if (!workspaceSlug) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">{t('myTasks.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('myTasks.subtitle')}</p>
      </div>

      {!grouped ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : grouped.open.length === 0 && grouped.done.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">{t('myTasks.empty')}</p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t('myTasks.open', { count: grouped.open.length })}</h2>
            {grouped.open.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('myTasks.noOpen')}</p>
            ) : (
              <div className="divide-y divide-border rounded-lg border border-border">
                {grouped.open.map((issue) => {
                  const state = statesById.get(issue.state_id)
                  const overdue = issue.due_date && Date.parse(issue.due_date) < Date.now()
                  return (
                    <Link
                      key={issue.id}
                      to={`/w/${workspaceSlug}/p/${issue.project_id}/issues/${issue.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted"
                    >
                      <PriorityIcon priority={issue.priority} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {issue.project.identifier}-{issue.sequence_id} · {issue.project.name}
                        </p>
                      </div>
                      {state && (
                        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">
                          {state.name}
                        </span>
                      )}
                      {issue.due_date && (
                        <span className={`shrink-0 text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {new Date(issue.due_date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {grouped.done.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{t('myTasks.completed', { count: grouped.done.length })}</h2>
              <div className="divide-y divide-border rounded-lg border border-border opacity-70">
                {grouped.done.slice(0, 10).map((issue) => (
                  <Link
                    key={issue.id}
                    to={`/w/${workspaceSlug}/p/${issue.project_id}/issues/${issue.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium line-through">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.project.identifier}-{issue.sequence_id} · {issue.project.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(issue.completed_at!, i18n.language)}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
