import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Blocks, Plus, Trash2 } from 'lucide-react'
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
import {
  addIssuesToModule,
  createModule,
  deleteModule,
  fetchModules,
  removeIssueFromModule,
} from '@/features/module/moduleSlice'
import { apiClient } from '@/lib/apiClient'
import type { ProjectModule } from '@/types/module'
import type { Issue, IssueListResponse } from '@/types/issue'

const STATUS_LABEL: Record<ProjectModule['status'], string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLOR: Record<ProjectModule['status'], string> = {
  backlog: 'bg-secondary text-secondary-foreground',
  in_progress: 'bg-blue-500/15 text-blue-500',
  paused: 'bg-amber-500/15 text-amber-500',
  completed: 'bg-emerald-500/15 text-emerald-500',
  cancelled: 'bg-red-500/15 text-red-500',
}

function CreateModuleDialog({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await dispatch(createModule({ workspaceSlug, projectId, payload: { name, description } })).unwrap()
      toast.success('Module created')
      setOpen(false)
      setName('')
      setDescription('')
    } catch {
      toast.error('Could not create module')
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
            New Module
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create module</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="module-name" className="text-sm font-medium">
              Name
            </label>
            <Input id="module-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="module-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea id="module-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function useModuleIssues(workspaceSlug: string, projectId: string, moduleId: string) {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, {
        params: { module: moduleId },
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
  }, [workspaceSlug, projectId, moduleId, reloadKey])

  return { issues, reload: () => setReloadKey((k) => k + 1) }
}

function ManageModuleIssuesDialog({
  workspaceSlug,
  projectId,
  module: mod,
  moduleIssueIds,
  onChanged,
}: {
  workspaceSlug: string
  projectId: string
  module: ProjectModule
  moduleIssueIds: Set<string>
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
      if (moduleIssueIds.has(issue.id)) {
        await dispatch(removeIssueFromModule({ workspaceSlug, projectId, moduleId: mod.id, issueId: issue.id })).unwrap()
      } else {
        await dispatch(addIssuesToModule({ workspaceSlug, projectId, moduleId: mod.id, issueIds: [issue.id] })).unwrap()
      }
      onChanged()
    } catch {
      toast.error('Failed to update module issues')
    } finally {
      setPending(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Manage Issues</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage issues in "{mod.name}"</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 space-y-1 overflow-y-auto">
          {!allIssues ? (
            <Skeleton className="h-40 w-full" />
          ) : allIssues.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No issues in this project yet.</p>
          ) : (
            allIssues.map((issue) => {
              const inModule = moduleIssueIds.has(issue.id)
              return (
                <button
                  key={issue.id}
                  onClick={() => void toggle(issue)}
                  disabled={pending === issue.id}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                >
                  <span className="truncate">{issue.title}</span>
                  <span className={inModule ? 'text-xs font-medium text-primary' : 'text-xs text-muted-foreground'}>
                    {inModule ? 'In module · remove' : 'Add'}
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

function ModuleCard({ mod, workspaceSlug, projectId }: { mod: ProjectModule; workspaceSlug: string; projectId: string }) {
  const dispatch = useAppDispatch()
  const { issues, reload } = useModuleIssues(workspaceSlug, projectId, mod.id)
  const moduleIssueIds = new Set((issues ?? []).map((i) => i.id))
  const completedCount = (issues ?? []).filter((i) => i.completed_at).length

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Blocks className="size-4 text-primary" />
          <h3 className="text-lg font-semibold">{mod.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[mod.status]}`}>
            {STATUS_LABEL[mod.status]}
          </span>
          <ManageModuleIssuesDialog
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            module={mod}
            moduleIssueIds={moduleIssueIds}
            onChanged={reload}
          />
          <button
            onClick={() => {
              if (confirm(`Delete module "${mod.name}"?`)) void dispatch(deleteModule({ workspaceSlug, projectId, moduleId: mod.id }))
            }}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Delete module"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      {mod.description && <p className="mb-3 text-sm text-muted-foreground">{mod.description}</p>}

      {issues === null ? (
        <Skeleton className="h-16 w-full" />
      ) : issues.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No issues linked to this module yet.
        </p>
      ) : (
        <>
          <div className="mb-2 text-xs text-muted-foreground">
            {completedCount} / {issues.length} issues completed
          </div>
          <div className="divide-y divide-border rounded-md border border-border">
            {issues.slice(0, 6).map((issue) => (
              <Link
                key={issue.id}
                to={`/w/${workspaceSlug}/p/${projectId}/issues/${issue.id}`}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted"
              >
                <span className="truncate">{issue.title}</span>
                {issue.completed_at && <span className="shrink-0 text-xs text-emerald-500">Done</span>}
              </Link>
            ))}
          </div>
          {issues.length > 6 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">+{issues.length - 6} more</p>
          )}
        </>
      )}
    </div>
  )
}

export default function ModulesPage() {
  const dispatch = useAppDispatch()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const modules = useAppSelector((state) => state.module.items)
  const isLoading = useAppSelector((state) => state.module.isLoading)

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    void dispatch(fetchModules({ workspaceSlug, projectId }))
  }, [workspaceSlug, projectId, dispatch])

  if (!workspaceSlug || !projectId) return null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Modules</h1>
          <p className="text-sm text-muted-foreground">Group related issues into shippable units of work.</p>
        </div>
        <CreateModuleDialog workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <Blocks className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No modules yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} workspaceSlug={workspaceSlug} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  )
}
