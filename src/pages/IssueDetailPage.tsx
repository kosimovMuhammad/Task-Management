import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Trash2, Link as LinkIcon, Calendar,
  Bold, Italic, List, Code, Image as ImageIcon, Link2, Ban,
  Share2, FileText, Plus, X, Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { NotFound } from '@/components/shared/NotFound'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchStates } from '@/features/state/stateSlice'
import { fetchLabels } from '@/features/label/labelSlice'
import { fetchProjectMembers } from '@/features/project/projectMembersSlice'
import { apiClient } from '@/lib/apiClient'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import {
  addAssignee,
  addComment,
  attachLabel,
  clearCurrentIssue,
  createRelation,
  deleteAttachment,
  deleteIssue,
  deleteRelation,
  detachLabel,
  fetchActivity,
  fetchAttachments,
  fetchComments,
  fetchIssue,
  fetchRelations,
  registerAttachment,
  removeAssignee,
  updateIssue,
} from '@/features/issue/issueSlice'
import type { Issue, IssueListResponse, IssuePriority, RelationType } from '@/types/issue'

const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none']
const RELATION_TYPES: RelationType[] = ['blocks', 'blocked_by', 'relates_to', 'duplicates']

function CustomPriorityIcon({ priority }: { priority: IssuePriority }) {
  switch (priority) {
    case 'urgent':
      return <div className="flex gap-0.5"><div className="w-1 h-3.5 bg-red-500 rounded-sm"></div><div className="w-1 h-3.5 bg-red-500 rounded-sm"></div><div className="w-1 h-3.5 bg-red-500 rounded-sm"></div></div>
    case 'high':
      return <div className="flex gap-0.5"><div className="w-0.5 h-1.5 bg-yellow-500 rounded-sm mt-auto"></div><div className="w-0.5 h-2.5 bg-yellow-500 rounded-sm mt-auto"></div><div className="w-0.5 h-3.5 bg-yellow-500 rounded-sm mt-auto"></div></div>
    case 'medium':
      return <div className="flex gap-0.5"><div className="w-0.5 h-1.5 bg-slate-400 rounded-sm mt-auto"></div><div className="w-0.5 h-2.5 bg-slate-400 rounded-sm mt-auto"></div><div className="w-0.5 h-3.5 bg-slate-600 rounded-sm mt-auto"></div></div>
    case 'low':
      return <div className="flex gap-0.5"><div className="w-0.5 h-1.5 bg-slate-400 rounded-sm mt-auto"></div><div className="w-0.5 h-2.5 bg-slate-600 rounded-sm mt-auto"></div><div className="w-0.5 h-3.5 bg-slate-600 rounded-sm mt-auto"></div></div>
    case 'none':
    default:
      return <div className="flex gap-0.5"><div className="w-0.5 h-1.5 bg-slate-600 rounded-sm mt-auto"></div><div className="w-0.5 h-2.5 bg-slate-600 rounded-sm mt-auto"></div><div className="w-0.5 h-3.5 bg-slate-600 rounded-sm mt-auto"></div></div>
  }
}

function useIssueScope() {
  const { workspaceSlug, projectId, issueId } = useParams<{
    workspaceSlug: string
    projectId: string
    issueId: string
  }>()
  return useMemo(
    () => ({ workspaceSlug: workspaceSlug ?? '', projectId: projectId ?? '', issueId: issueId ?? '' }),
    [workspaceSlug, projectId, issueId],
  )
}

function AddRelationRow() {
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const [open, setOpen] = useState(false)
  const [relationType, setRelationType] = useState<RelationType>('relates_to')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Issue[]>([])

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      apiClient
        .get<IssueListResponse>(`/workspaces/${scope.workspaceSlug}/projects/${scope.projectId}/issues/`, {
          params: { search: query, limit: 5 },
        })
        .then((res) => setResults(res.data.data.filter((i) => i.id !== scope.issueId)))
    }, 300)
    return () => clearTimeout(handle)
  }, [open, query, scope])

  async function link(issue: Issue) {
    try {
      await dispatch(createRelation({ ...scope, relatedIssueId: issue.id, relationType })).unwrap()
      toast.success('Relation added')
      setOpen(false)
      setQuery('')
    } catch {
      toast.error('Failed to add relation')
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 p-3 text-[13px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] transition-colors"
      >
        <Plus className="size-3.5" /> Add relation
      </button>
    )
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Select value={relationType} onValueChange={(v) => v && setRelationType(v as RelationType)}>
          <SelectTrigger className="h-8 bg-[#1a1a1c] border-white/10 text-slate-300 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
            {RELATION_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="capitalize">
                {type.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
          <X className="size-4" />
        </button>
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search issues..."
          className="h-8 pl-8 bg-[#1a1a1c] border-white/10 text-slate-200 text-xs"
        />
      </div>
      {results.length > 0 && (
        <div className="rounded-lg border border-white/5 divide-y divide-white/5 overflow-hidden">
          {results.map((issue) => (
            <button
              key={issue.id}
              onClick={() => void link(issue)}
              className="block w-full truncate px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
            >
              {issue.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RelationsPanel({ projectIdentifier }: { projectIdentifier: string }) {
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const relations = useAppSelector((state) => state.issue.relations)

  const hasAny = relations && RELATION_TYPES.some((type) => (relations[type] ?? []).length > 0)

  return (
    <div className="mb-10">
      <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">Relations</h3>
      <div className="rounded-xl border border-white/5 bg-[#141517] overflow-hidden divide-y divide-white/5">
        {!hasAny && (
          <p className="p-3 text-[13px] text-slate-500">No relations yet.</p>
        )}
        {RELATION_TYPES.map((type) => {
          const items = relations?.[type] ?? []
          return items.map((rel) => (
            <div key={rel.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors group">
              {type === 'blocks' ? (
                <div className="size-5 rounded-full border border-red-500/20 bg-red-500/10 flex items-center justify-center shrink-0">
                  <Ban className="size-3 text-red-500" />
                </div>
              ) : (
                <div className="size-5 rounded-full border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Link2 className="size-3 text-emerald-500" />
                </div>
              )}

              <div className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-slate-400 capitalize shrink-0">{type.replace('_', ' ')}</span>
                <span className="text-slate-200 shrink-0">
                  {projectIdentifier}-{rel.related_issue?.sequence_id ?? '?'}:
                </span>
                <span className="text-slate-400 truncate">{rel.related_issue?.title ?? rel.related_issue_id}</span>
              </div>

              <button
                onClick={() => void dispatch(deleteRelation({ ...scope, linkId: rel.id }))}
                className="ml-auto shrink-0 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        })}

        <AddRelationRow />
      </div>
    </div>
  )
}

function ActivityTimeline() {
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const comments = useAppSelector((state) => state.issue.comments)
  const activity = useAppSelector((state) => state.issue.activity)
  const user = useAppSelector((state) => state.auth.user)
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tab, setTab] = useState<'all' | 'comments' | 'history'>('all')

  const items = useMemo(() => {
    const merged = [
      ...(tab !== 'history' ? comments.map((c) => ({ type: 'comment' as const, data: c, date: new Date(c.created_at) })) : []),
      ...(tab !== 'comments' ? activity.map((a) => ({ type: 'activity' as const, data: a, date: new Date(a.created_at) })) : []),
    ]
    return merged.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [comments, activity, tab])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setIsSubmitting(true)
    try {
      await dispatch(addComment({ ...scope, body })).unwrap()
      setBody('')
    } catch {
      toast.error('Failed to post comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Activity</h3>
        <div className="flex items-center gap-4 text-[12px] font-medium text-slate-400">
          <button onClick={() => setTab('all')} className={tab === 'all' ? 'text-slate-200' : 'hover:text-slate-200'}>
            All
          </button>
          <button onClick={() => setTab('comments')} className={tab === 'comments' ? 'text-slate-200' : 'hover:text-slate-200'}>
            Comments ({comments.length})
          </button>
          <button onClick={() => setTab('history')} className={tab === 'history' ? 'text-slate-200' : 'hover:text-slate-200'}>
            History
          </button>
        </div>
      </div>

      <div className="relative pl-4 space-y-6">
        <div className="absolute top-2 bottom-2 left-[31px] w-[1px] bg-white/5"></div>

        {items.length === 0 && <p className="text-[13px] text-slate-500 pl-4">Nothing here yet.</p>}

        {items.map((item) => {
          if (item.type === 'comment') {
            const comment = item.data
            return (
              <div key={`c-${comment.id}`} className="relative flex gap-4">
                <div className="size-8 rounded-full overflow-hidden bg-slate-700 shrink-0 relative z-10 border-4 border-background">
                  {comment.author?.avatar_url ? (
                    <img src={comment.author.avatar_url} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-xs font-bold text-white bg-indigo-500">
                      {comment.author?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-bold text-slate-200">{comment.author?.display_name}</span>
                    <span className="text-[12px] text-slate-500">{formatRelativeTime(comment.created_at, 'en')}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#1a1a1c] p-4">
                    <p className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              </div>
            )
          }
          const act = item.data as Record<string, unknown> & { id: string; created_at: string; author?: { display_name?: string } }
          const desc = typeof act.description === 'string' ? act.description : 'made a change'
          return (
            <div key={`a-${act.id}`} className="relative flex gap-4 items-center">
              <div className="size-8 flex items-center justify-center shrink-0 relative z-10">
                <div className="size-2 rounded-full bg-slate-600 border-2 border-background"></div>
              </div>
              <div className="flex-1 text-[13px] text-slate-400">
                <span className="font-semibold text-slate-300">{act.author?.display_name ?? 'System'}</span> {desc}
                <span className="text-slate-500 ml-2">• {formatRelativeTime(act.created_at, 'en')}</span>
              </div>
            </div>
          )
        })}

        <div className="relative flex gap-4 pt-4">
          <div className="size-8 rounded-full overflow-hidden bg-slate-700 shrink-0 relative z-10 border-4 border-background">
            <div className="size-full flex items-center justify-center text-xs font-bold text-white bg-emerald-500">
              {user?.display_name?.slice(0, 2).toUpperCase() ?? 'ME'}
            </div>
          </div>
          <div className="flex-1">
            <form onSubmit={(e) => void handleSubmit(e)} className="relative">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Leave a comment..."
                className="min-h-12 bg-[#1a1a1c] border-white/10 text-slate-300 rounded-xl resize-none py-3"
              />
              <div className="absolute right-2 bottom-2">
                <Button type="submit" size="sm" disabled={isSubmitting || !body.trim()} className="h-8 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3">
                  Comment
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttachmentsPanel() {
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const attachments = useAppSelector((state) => state.issue.attachments)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setIsUploading(true)
    try {
      await dispatch(registerAttachment({ ...scope, file })).unwrap()
    } catch {
      toast.error('Failed to upload attachment')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Attachments</h3>
        <label className={`cursor-pointer text-slate-500 hover:text-slate-300 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Share2 className="size-3.5" />
          <input
            type="file"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      </div>

      {attachments.length === 0 ? (
        <p className="text-[13px] text-slate-500">No attachments yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {attachments.map((a) => (
            <div key={a.id} className="aspect-[4/3] rounded-xl border border-white/5 bg-[#1e1e20] flex flex-col items-center justify-center gap-2 group hover:border-white/10 transition-colors relative">
              {a.mime_type.startsWith('image/') ? (
                <img src={a.download_url} alt={a.file_name} className="size-full object-cover rounded-xl" />
              ) : (
                <>
                  <FileText className="size-6 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate w-24 text-center">{a.file_name}</span>
                </>
              )}
              <button
                onClick={() => void dispatch(deleteAttachment({ ...scope, attachmentId: a.id }))}
                className="absolute top-2 right-2 size-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ParentField({ issue }: { issue: Issue }) {
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const [parent, setParent] = useState<Issue | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Issue[]>([])

  useEffect(() => {
    if (!issue.parent_id) {
      setParent(null)
      return
    }
    let cancelled = false
    apiClient
      .get<Issue>(`/workspaces/${scope.workspaceSlug}/projects/${scope.projectId}/issues/${issue.parent_id}`)
      .then((res) => {
        if (!cancelled) setParent(res.data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [issue.parent_id, scope.workspaceSlug, scope.projectId])

  useEffect(() => {
    if (!open || !query.trim()) {
      setResults([])
      return
    }
    const handle = setTimeout(() => {
      apiClient
        .get<IssueListResponse>(`/workspaces/${scope.workspaceSlug}/projects/${scope.projectId}/issues/`, {
          params: { search: query, limit: 5 },
        })
        .then((res) => setResults(res.data.data.filter((i) => i.id !== issue.id)))
    }, 300)
    return () => clearTimeout(handle)
  }, [open, query, scope, issue.id])

  async function setParentIssue(target: Issue | null) {
    try {
      await dispatch(updateIssue({ ...scope, payload: { parent_id: target?.id ?? null } })).unwrap()
      setOpen(false)
      setQuery('')
    } catch {
      toast.error('Failed to update parent issue')
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <Share2 className="size-3.5" /> Parent
        </div>
        {parent ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-indigo-400 font-medium truncate max-w-32">{parent.title}</span>
            <button onClick={() => void setParentIssue(null)} className="text-slate-500 hover:text-red-400">
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setOpen((v) => !v)} className="text-[13px] text-slate-500 hover:text-slate-300">
            Set parent
          </button>
        )}
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues..."
            className="h-8 bg-[#1a1a1c] border-white/10 text-slate-200 text-xs"
          />
          {results.length > 0 && (
            <div className="rounded-lg border border-white/5 divide-y divide-white/5 overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => void setParentIssue(r)}
                  className="block w-full truncate px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5"
                >
                  {r.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AttributesRail({ issue }: { issue: Issue }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const scope = useIssueScope()
  const states = useAppSelector((state) => state.state.items)
  const labels = useAppSelector((state) => state.label.items)
  const projectMembers = useAppSelector((state) => state.projectMembers.items)
  const [dueDateEditing, setDueDateEditing] = useState(false)
  const [estimateEditing, setEstimateEditing] = useState(false)
  const [estimateValue, setEstimateValue] = useState(issue.estimate_points?.toString() ?? '')

  const assignedIds = new Set(issue.assignees.map((a) => a.id))
  const availableMembers = projectMembers.filter((m) => !assignedIds.has(m.user_id))

  async function handleDelete() {
    if (!confirm('Delete this issue? This cannot be undone.')) return
    try {
      await dispatch(deleteIssue(scope)).unwrap()
      toast.success('Issue deleted')
      navigate(`/w/${scope.workspaceSlug}/p/${scope.projectId}/issues`)
    } catch {
      toast.error('Failed to delete issue')
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard')
  }

  async function saveEstimate() {
    setEstimateEditing(false)
    const parsed = estimateValue.trim() ? Number(estimateValue) : null
    if (parsed === issue.estimate_points) return
    try {
      await dispatch(updateIssue({ ...scope, payload: { estimate_points: parsed } })).unwrap()
    } catch {
      toast.error('Failed to update estimate')
    }
  }

  return (
    <div className="w-80 shrink-0 p-8 flex flex-col h-full overflow-y-auto">
      <div className="mb-8">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4">Properties</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <span className="w-24 text-[13px] text-slate-400">Status</span>
            <div className="flex-1 flex justify-end">
              <Select
                value={issue.state_id}
                onValueChange={(v) => v && void dispatch(updateIssue({ ...scope, payload: { state_id: v } }))}
              >
                <SelectTrigger className="h-8 border border-indigo-500/20 bg-indigo-500/10 shadow-none rounded-md px-3 text-[13px] text-indigo-300 font-medium hover:bg-indigo-500/20 w-fit">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-indigo-400"></div>
                    <SelectValue>{() => states.find((s) => s.id === issue.state_id)?.name ?? issue.state_id}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center">
            <span className="w-24 text-[13px] text-slate-400">Priority</span>
            <div className="flex-1 flex justify-end">
              <Select
                value={issue.priority}
                onValueChange={(v) => v && void dispatch(updateIssue({ ...scope, payload: { priority: v as IssuePriority } }))}
              >
                <SelectTrigger className="h-8 border-0 bg-transparent shadow-none px-0 text-[13px] text-slate-300 font-medium hover:text-slate-100 w-fit focus:ring-0">
                  <SelectValue>
                    {() => (
                      <span className="flex items-center gap-2 capitalize">
                        <CustomPriorityIcon priority={issue.priority} />
                        {issue.priority}
                      </span>
                    )}
                  </SelectValue>
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
          </div>

          <div className="flex items-start">
            <span className="w-24 text-[13px] text-slate-400 pt-1">Assignees</span>
            <div className="flex-1 flex flex-wrap justify-end gap-1.5">
              {issue.assignees.map((a) => (
                <div key={a.id} className="group relative flex items-center">
                  <div className="size-6 rounded-full overflow-hidden bg-slate-700" title={a.display_name}>
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.display_name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-[10px] font-bold text-white">
                        {a.display_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => void dispatch(removeAssignee({ ...scope, userId: a.id }))}
                    className="absolute -top-1 -right-1 size-3.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="size-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors">
                      <Plus className="size-3" />
                    </button>
                  }
                />
                <DropdownMenuContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  {availableMembers.length === 0 && <div className="px-2 py-1.5 text-xs text-slate-500">No members to add</div>}
                  {availableMembers.map((m) => (
                    <DropdownMenuItem
                      key={m.user_id}
                      onClick={() => void dispatch(addAssignee({ ...scope, userId: m.user_id }))}
                    >
                      {m.user.display_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-start">
            <span className="w-24 text-[13px] text-slate-400 pt-1">Labels</span>
            <div className="flex-1 flex flex-wrap justify-end gap-2">
              {issue.labels?.map((label) => (
                <span
                  key={label.id}
                  className="group flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium"
                  style={{ borderColor: `${label.color}55`, color: label.color, backgroundColor: `${label.color}15` }}
                >
                  {label.name}
                  <button onClick={() => void dispatch(detachLabel({ ...scope, labelId: label.id }))} className="opacity-60 hover:opacity-100">
                    <X className="size-2.5" />
                  </button>
                </span>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button className="px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-[11px] text-slate-400 hover:bg-white/10">
                      + Add
                    </button>
                  }
                />
                <DropdownMenuContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  {labels.filter((l) => !issue.labels.some((il) => il.id === l.id)).length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-slate-500">No more labels</div>
                  )}
                  {labels
                    .filter((l) => !issue.labels.some((il) => il.id === l.id))
                    .map((l) => (
                      <DropdownMenuItem key={l.id} onClick={() => void dispatch(attachLabel({ ...scope, labelId: l.id }))}>
                        <span className="size-2 rounded-full" style={{ backgroundColor: l.color }} />
                        {l.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/5 mb-8"></div>

      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-slate-400">
            <Calendar className="size-3.5" /> Due Date
          </div>
          {dueDateEditing ? (
            <input
              type="date"
              autoFocus
              defaultValue={issue.due_date?.slice(0, 10) ?? ''}
              onBlur={(e) => {
                setDueDateEditing(false)
                const value = e.target.value || null
                if (value !== (issue.due_date?.slice(0, 10) ?? null)) {
                  void dispatch(updateIssue({ ...scope, payload: { due_date: value } }))
                }
              }}
              className="bg-[#1a1a1c] border border-white/10 rounded px-2 py-1 text-[13px] text-slate-200"
            />
          ) : (
            <button
              onClick={() => setDueDateEditing(true)}
              className="text-[13px] text-slate-300 font-medium hover:text-indigo-300"
            >
              {issue.due_date ? new Date(issue.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Set date'}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-slate-400">
            <Calendar className="size-3.5" /> Estimate
          </div>
          {estimateEditing ? (
            <input
              type="number"
              min={0}
              autoFocus
              value={estimateValue}
              onChange={(e) => setEstimateValue(e.target.value)}
              onBlur={() => void saveEstimate()}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-16 bg-[#1a1a1c] border border-white/10 rounded px-2 py-1 text-[13px] text-slate-200 text-right"
            />
          ) : (
            <button
              onClick={() => {
                setEstimateValue(issue.estimate_points?.toString() ?? '')
                setEstimateEditing(true)
              }}
              className="text-[13px] text-slate-300 font-medium hover:text-indigo-300"
            >
              {issue.estimate_points != null ? `${issue.estimate_points} Points` : 'Set estimate'}
            </button>
          )}
        </div>
        <ParentField issue={issue} />
      </div>

      <AttachmentsPanel />

      <div className="mt-auto space-y-4 pt-8">
        <button onClick={() => void handleCopyLink()} className="flex items-center gap-3 text-[13px] font-medium text-slate-300 hover:text-slate-100 transition-colors w-full">
          <LinkIcon className="size-4 text-slate-500" />
          Copy Link
        </button>
        <button onClick={() => void handleDelete()} className="flex items-center gap-3 text-[13px] font-medium text-red-400 hover:text-red-300 transition-colors w-full">
          <Trash2 className="size-4" />
          Delete Issue
        </button>
      </div>
    </div>
  )
}

function DescriptionToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
}) {
  const wrapSelection = (before: string, after: string = before) => {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    const next = `${value.slice(0, start)}${before}${value.slice(start, end)}${after}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
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
    <div className="flex items-center gap-5 pb-3 border-b border-white/5 text-slate-400">
      <button type="button" onClick={() => wrapSelection('**')} className="hover:text-slate-200 transition-colors"><Bold className="size-4" /></button>
      <button type="button" onClick={() => wrapSelection('*')} className="hover:text-slate-200 transition-colors"><Italic className="size-4" /></button>
      <button type="button" onClick={() => prefixLine('- ')} className="hover:text-slate-200 transition-colors"><List className="size-4" /></button>
      <button type="button" onClick={() => wrapSelection('`')} className="hover:text-slate-200 transition-colors"><Code className="size-4" /></button>
      <button type="button" onClick={() => wrapSelection('[', '](url)')} className="hover:text-slate-200 transition-colors"><LinkIcon className="size-4" /></button>
      <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
      <button type="button" className="hover:text-slate-200 transition-colors"><ImageIcon className="size-4" /></button>
    </div>
  )
}

function DiscardChangesDialog({ open, onCancel, onDiscard }: { open: boolean; onCancel: () => void; onDiscard: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-sm bg-[#1a1a1c] border-white/10 text-slate-200">
        <DialogHeader>
          <DialogTitle>Discard changes?</DialogTitle>
          <DialogDescription className="text-slate-400">
            You have unsaved changes. Are you sure you want to discard them? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} className="text-slate-300">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function IssueDetailPage() {
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const issue = useAppSelector((state) => state.issue.current)
  const error = useAppSelector((state) => state.issue.error)
  const project = useAppSelector((state) => state.project.items.find((p) => p.id === scope.projectId))

  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scope.issueId && scope.projectId) {
      void dispatch(fetchIssue(scope))
      void dispatch(fetchComments(scope))
      void dispatch(fetchActivity(scope))
      void dispatch(fetchRelations(scope))
      void dispatch(fetchAttachments(scope))
      void dispatch(fetchStates({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId }))
      void dispatch(fetchLabels({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId }))
      void dispatch(fetchProjectMembers({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId }))
    }
    return () => {
      dispatch(clearCurrentIssue())
    }
  }, [scope.workspaceSlug, scope.projectId, scope.issueId, dispatch])

  function startEditing() {
    if (!issue) return
    setTitleDraft(issue.title)
    setDescriptionDraft(issue.description ?? '')
    setIsEditing(true)
  }

  const isDirty = issue ? titleDraft !== issue.title || descriptionDraft !== (issue.description ?? '') : false

  function requestCancel() {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      setIsEditing(false)
    }
  }

  async function handleSave() {
    if (!issue) return
    setIsSaving(true)
    try {
      await dispatch(
        updateIssue({ ...scope, payload: { title: titleDraft.trim() || issue.title, description: descriptionDraft } }),
      ).unwrap()
      toast.success('Issue updated')
      setIsEditing(false)
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (error) {
    return <NotFound />
  }

  if (!issue || issue.id !== scope.issueId) {
    return (
      <div className="flex h-full bg-background flex-col p-8">
        <Skeleton className="h-4 w-48 mb-8 bg-white/5" />
        <Skeleton className="h-12 w-3/4 mb-12 bg-white/5" />
        <Skeleton className="h-64 w-full bg-white/5 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 xl:pr-16 custom-scrollbar">
        <div className="max-w-3xl ml-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-[12px] text-slate-500 font-medium">
              <span className="uppercase">{project?.identifier ?? 'PROJ'}-{issue.sequence_id}</span>
              <span>•</span>
              <span>Created {formatRelativeTime(issue.created_at, 'en')}</span>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={requestCancel} className="text-slate-300">
                  Cancel
                </Button>
                <Button size="sm" onClick={() => void handleSave()} disabled={isSaving} className="bg-indigo-500 hover:bg-indigo-600 text-white">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            ) : (
              <button onClick={startEditing} className="text-[12px] font-medium text-slate-400 hover:text-slate-200">
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="mb-6 w-full bg-transparent text-3xl font-extrabold text-slate-100 tracking-tight leading-tight outline-none border-b border-white/10 focus:border-indigo-500/50 pb-2"
            />
          ) : (
            <h1 className="mb-6 text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">{issue.title}</h1>
          )}

          <div className="mb-10">
            {isEditing ? (
              <>
                <DescriptionToolbar textareaRef={descriptionRef} value={descriptionDraft} onChange={setDescriptionDraft} />
                <Textarea
                  ref={descriptionRef}
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  placeholder="Add description..."
                  className="min-h-40 bg-transparent border-0 rounded-none px-0 py-6 text-[14px] text-slate-300 leading-loose resize-none focus-visible:ring-0"
                />
              </>
            ) : (
              <p className="py-6 text-[14px] text-slate-300 leading-loose whitespace-pre-wrap">
                {issue.description || <span className="text-slate-500">No description provided. Click Edit to add one.</span>}
              </p>
            )}
          </div>

          <RelationsPanel projectIdentifier={project?.identifier ?? 'PROJ'} />
          <ActivityTimeline />
        </div>
      </div>

      <AttributesRail issue={issue} />

      <DiscardChangesDialog
        open={showDiscardDialog}
        onCancel={() => setShowDiscardDialog(false)}
        onDiscard={() => {
          setShowDiscardDialog(false)
          setIsEditing(false)
        }}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
