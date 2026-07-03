import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setCreateIssueOpen } from '@/features/ui/uiSlice'
import { fetchProjects } from '@/features/project/projectSlice'
import { fetchStates } from '@/features/state/stateSlice'
import { fetchLabels } from '@/features/label/labelSlice'
import { fetchProjectMembers } from '@/features/project/projectMembersSlice'
import { createIssue } from '@/features/issue/issueSlice'
import type { IssuePriority } from '@/types/issue'

const PRIORITIES: IssuePriority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function CreateIssueModal() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { workspaceSlug: routeWorkspaceSlug, projectId: routeProjectId } = useParams<{
    workspaceSlug: string
    projectId: string
  }>()

  const isOpen = useAppSelector((state) => state.ui.isCreateIssueOpen)
  const defaults = useAppSelector((state) => state.ui.createIssueDefaults)
  const workspace = useAppSelector((state) => state.workspace.current)
  const projects = useAppSelector((state) => state.project.items)
  const states = useAppSelector((state) => state.state.items)
  const labels = useAppSelector((state) => state.label.items)
  const members = useAppSelector((state) => state.projectMembers.items)

  const workspaceSlug = routeWorkspaceSlug ?? workspace?.slug ?? ''

  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stateId, setStateId] = useState('')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [estimate, setEstimate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [labelIds, setLabelIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize/reset fields whenever the modal opens
  useEffect(() => {
    if (!isOpen) return
    setProjectId(defaults?.projectId ?? routeProjectId ?? '')
    setTitle('')
    setDescription('')
    setStateId(defaults?.stateId ?? '')
    setPriority('medium')
    setEstimate('')
    setAssigneeId('')
    setLabelIds([])
  }, [isOpen, defaults, routeProjectId])

  useEffect(() => {
    if (isOpen && workspaceSlug && projects.length === 0) {
      void dispatch(fetchProjects(workspaceSlug))
    }
  }, [isOpen, workspaceSlug, projects.length, dispatch])

  useEffect(() => {
    if (!projectId) return
    if (!projectId && !projects.some((p) => p.id === projectId) && projects.length > 0) {
      setProjectId(projects[0].id)
      return
    }
    if (!workspaceSlug) return
    void dispatch(fetchStates({ workspaceSlug, projectId }))
    void dispatch(fetchLabels({ workspaceSlug, projectId }))
    void dispatch(fetchProjectMembers({ workspaceSlug, projectId }))
  }, [projectId, workspaceSlug, projects, dispatch])

  // Default the project to the first available one once projects load, if none was preselected
  useEffect(() => {
    if (isOpen && !projectId && projects.length > 0) {
      setProjectId(projects[0].id)
    }
  }, [isOpen, projectId, projects])

  const projectStates = useMemo(() => [...states].sort((a, b) => a.order - b.order), [states])

  useEffect(() => {
    if (!stateId && projectStates.length > 0) {
      const defaultState = projectStates.find((s) => s.is_default) ?? projectStates[0]
      setStateId(defaultState.id)
    }
  }, [projectStates, stateId])

  function toggleLabel(id: string) {
    setLabelIds((prev) => (prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]))
  }

  function close() {
    dispatch(setCreateIssueOpen(false))
  }

  async function handleSubmit() {
    if (!workspaceSlug || !projectId || !stateId || !title.trim()) return
    setIsSubmitting(true)
    try {
      const issue = await dispatch(
        createIssue({
          workspaceSlug,
          projectId,
          payload: {
            title: title.trim(),
            description: description.trim() || undefined,
            state_id: stateId,
            priority,
            assignee_ids: assigneeId ? [assigneeId] : undefined,
            label_ids: labelIds.length > 0 ? labelIds : undefined,
            estimate_points: estimate ? Number(estimate) : undefined,
          },
        }),
      ).unwrap()
      toast.success('Issue created')
      close()
      navigate(`/w/${workspaceSlug}/p/${projectId}/issues/${issue.id}`)
    } catch {
      toast.error('Failed to create issue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-2xl bg-[#121214] border-white/10 text-slate-200 p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold text-slate-100">Create New Issue</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Title</label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              className="bg-[#1a1a1c] border-white/10 text-slate-200"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              className="bg-[#1a1a1c] border-white/10 text-slate-200 min-h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Project</label>
              <Select value={projectId} onValueChange={(v) => v && setProjectId(v)}>
                <SelectTrigger className="w-full bg-[#1a1a1c] border-white/10 text-slate-200">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Estimate</label>
              <Input
                type="number"
                min={0}
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="Points"
                className="bg-[#1a1a1c] border-white/10 text-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Status</label>
              <Select value={stateId} onValueChange={(v) => v && setStateId(v)}>
                <SelectTrigger className="w-full bg-[#1a1a1c] border-white/10 text-slate-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  {projectStates.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Priority</label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v as IssuePriority)}>
                <SelectTrigger className="w-full bg-[#1a1a1c] border-white/10 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {labels.length === 0 && <span className="text-xs text-slate-500">No labels in this project</span>}
                {labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label.id)}
                    className={`rounded px-2 py-1 text-[11px] font-medium border transition-colors ${
                      labelIds.includes(label.id)
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Assignee</label>
              <Select value={assigneeId || '__none'} onValueChange={(v) => setAssigneeId(v && v !== '__none' ? v : '')}>
                <SelectTrigger className="w-full bg-[#1a1a1c] border-white/10 text-slate-200">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  <SelectItem value="__none">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.user.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-white/5 bg-transparent">
          <Button variant="ghost" onClick={close} className="text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !title.trim() || !projectId || !stateId}
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            {isSubmitting ? 'Creating...' : 'Create Issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
