import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { FolderKanban, Plus } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppSelector } from '@/hooks/useAppSelector'
import type { Issue, IssueListResponse } from '@/types/issue'
import type { Project } from '@/types/project'

function useGreeting() {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  if (hour < 12) return t('dashboard.goodMorning')
  if (hour < 18) return t('dashboard.goodAfternoon')
  return t('dashboard.goodEvening')
}

interface RecentIssue extends Issue {
  project: Project
}

function useRecentIssues(workspaceSlug: string, projects: Project[], projectsLoading: boolean) {
  const [issues, setIssues] = useState<RecentIssue[] | null>(null)

  useEffect(() => {
    if (projectsLoading) return

    if (projects.length === 0) {
      setIssues([])
      return
    }
    let cancelled = false
    setIssues(null)

    Promise.all(
      projects.slice(0, 10).map((project) =>
        apiClient
          .get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${project.id}/issues/`, {
            params: { sort_by: 'updated_at', order: 'desc' },
          })
          .then((res) => res.data.data.slice(0, 5).map((issue) => ({ ...issue, project }))),
      ),
    )
      .then((results) => {
        if (cancelled) return
        const merged = results
          .flat()
          .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
          .slice(0, 8)
        setIssues(merged)
      })
      .catch(() => {
        if (!cancelled) setIssues([])
      })

    return () => {
      cancelled = true
    }
  }, [workspaceSlug, projects, projectsLoading])

  return issues
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const user = useAppSelector((state) => state.auth.user)
  const projects = useAppSelector((state) => state.project.items)
  const projectsLoading = useAppSelector((state) => state.project.isLoading)
  const greeting = useGreeting()
  const recentIssues = useRecentIssues(workspaceSlug ?? '', projects, projectsLoading)

  const today = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">
          {greeting}, {user?.display_name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{today}</p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">{t('dashboard.yourProjects')}</h2>
          <Link to={`/w/${workspaceSlug}/projects`} className="text-sm text-primary hover:underline">
            {t('dashboard.viewAll')}
          </Link>
        </div>

        {projectsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Link
            to={`/w/${workspaceSlug}/projects`}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" />
            {t('dashboard.createFirstProject')}
          </Link>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                to={`/w/${workspaceSlug}/p/${project.id}/issues`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <FolderKanban className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.identifier}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('dashboard.recents')}</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-2 font-medium">{t('dashboard.issue')}</th>
                <th className="px-4 py-2 font-medium">{t('dashboard.title')}</th>
                <th className="px-4 py-2 text-right font-medium">{t('dashboard.updated')}</th>
              </tr>
            </thead>
            <tbody>
              {recentIssues === null &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3" colSpan={3}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))}
              {recentIssues?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                    {t('common.noResults')}
                  </td>
                </tr>
              )}
              {recentIssues?.map((issue) => (
                <tr key={issue.id} className="border-b border-border last:border-0 hover:bg-card">
                  <td className="px-4 py-3 text-muted-foreground">
                    {issue.project.identifier}-{issue.sequence_id}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/w/${workspaceSlug}/p/${issue.project_id}/issues/${issue.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {issue.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatRelativeTime(issue.updated_at, i18n.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
