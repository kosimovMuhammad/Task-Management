import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { 
  Paperclip, Send, Trash2, Link as LinkIcon, Calendar, 
  ChevronUp, ChevronRight, ChevronsUp, AlertCircle, Circle,
  Bold, Italic, List, Code, Image as ImageIcon, Link2, Ban,
  Share2, FileText, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { NotFound } from '@/components/shared/NotFound'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchStates } from '@/features/state/stateSlice'
import { fetchCycles } from '@/features/cycle/cycleSlice'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import {
  addComment,
  clearCurrentIssue,
  createRelation,
  deleteAttachment,
  deleteRelation,
  fetchActivity,
  fetchAttachments,
  fetchComments,
  fetchIssue,
  fetchRelations,
  registerAttachment,
  updateIssue,
} from '@/features/issue/issueSlice'
import type { IssuePriority, RelationType } from '@/types/issue'

const PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low', 'none']
const RELATION_TYPES: RelationType[] = ['blocks', 'blocked_by', 'relates_to', 'duplicates']

// Helper to render linear-style priority icons
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
  return { workspaceSlug: workspaceSlug ?? '', projectId: projectId ?? '', issueId: issueId ?? '' }
}

function RelationsPanel() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const relations = useAppSelector((state) => state.issue.relations)

  return (
    <div className="mb-10">
      <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">Relations</h3>
      <div className="rounded-xl border border-white/5 bg-[#141517] overflow-hidden divide-y divide-white/5">
        
        {RELATION_TYPES.map((type) => {
          const items = relations?.[type] ?? []
          if (items.length === 0) return null
          return items.map((rel) => (
            <div key={rel.id} className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors group">
              {type === 'blocks' ? (
                <div className="size-5 rounded-full border border-red-500/20 bg-red-500/10 flex items-center justify-center">
                  <Ban className="size-3 text-red-500" />
                </div>
              ) : (
                <div className="size-5 rounded-full border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
                  <Link2 className="size-3 text-emerald-500" />
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 capitalize">{t(`issueDetail.relation.${type}`)}</span>
                <span className="text-slate-200">{rel.related_issue?.identifier ?? 'ISSUE'}:</span>
                <span className="text-slate-400">{rel.related_issue?.title ?? rel.related_issue_id}</span>
              </div>
              
              <button
                onClick={() => void dispatch(deleteRelation({ ...scope, linkId: rel.id }))}
                className="ml-auto text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        })}
        
        <button className="w-full flex items-center gap-2 p-3 text-[13px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] transition-colors">
          <Plus className="size-3.5" /> Add relation
        </button>
      </div>
    </div>
  )
}

function ActivityTimeline() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const comments = useAppSelector((state) => state.issue.comments)
  const activity = useAppSelector((state) => state.issue.activity)
  const user = useAppSelector((state) => state.auth.user)
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Combine and sort comments and activity
  const items = [
    ...comments.map(c => ({ type: 'comment', data: c, date: new Date(c.created_at) })),
    ...activity.map(a => ({ type: 'activity', data: a, date: new Date(a.created_at) }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setIsSubmitting(true)
    try {
      await dispatch(addComment({ ...scope, body })).unwrap()
      setBody('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Activity</h3>
        <div className="flex items-center gap-4 text-[12px] font-medium text-slate-400">
          <button className="text-slate-200">Comments</button>
          <button className="hover:text-slate-200">History</button>
        </div>
      </div>
      
      <div className="relative pl-4 space-y-6">
        {/* Timeline Line */}
        <div className="absolute top-2 bottom-2 left-[31px] w-[1px] bg-white/5"></div>
        
        {items.map((item, idx) => {
          if (item.type === 'comment') {
            const comment = item.data as any
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
                    <span className="text-[12px] text-slate-500">{formatRelativeTime(comment.created_at, i18n.language)}</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-[#1a1a1c] p-4">
                    <p className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">{comment.body}</p>
                    
                    {/* Mock Reactions just for visual replica */}
                    {idx === 0 && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300 font-medium">
                          🔥 3
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[11px] text-slate-300 font-medium">
                          👍 1
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          } else {
            const act = item.data as any
            const desc = typeof act.description === 'string' ? act.description : JSON.stringify(act)
            return (
              <div key={`a-${act.id}`} className="relative flex gap-4 items-center">
                <div className="size-8 flex items-center justify-center shrink-0 relative z-10">
                  <div className="size-2 rounded-full bg-slate-600 border-2 border-background"></div>
                </div>
                <div className="flex-1 text-[13px] text-slate-400">
                  <span className="font-semibold text-slate-300">{act.author?.display_name ?? 'System'}</span>{' '}
                  {desc}
                  <span className="text-slate-500 ml-2">• {formatRelativeTime(act.created_at, i18n.language)}</span>
                </div>
              </div>
            )
          }
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
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const attachments = useAppSelector((state) => state.issue.attachments)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setIsUploading(true)
    try {
      await dispatch(registerAttachment({ ...scope, file })).unwrap()
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Attachments</h3>
        <label className="cursor-pointer text-slate-500 hover:text-slate-300">
          <Share2 className="size-3.5" />
          <input
            type="file"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
        </label>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Mock visual from screenshot */}
        <div className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 relative group bg-black/50">
          <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop" alt="Code snippet" className="size-full object-cover opacity-80" />
        </div>
        <div className="aspect-[4/3] rounded-xl border border-white/5 bg-[#1e1e20] flex flex-col items-center justify-center gap-2 group hover:border-white/10 transition-colors">
          <FileText className="size-6 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SPEC_V2.PDF</span>
        </div>
        
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
    </div>
  )
}

function AttributesRail({ issue }: { issue: any }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const states = useAppSelector((state) => state.state.items)
  const project = useAppSelector((state) => state.project.items.find((p) => p.id === scope.projectId))

  if (!issue) return null

  // Generate deterministic beautiful label colors
  function getLabelColor(name: string) {
    const normalized = name.toUpperCase()
    if (normalized.includes('FRONTEND') || normalized.includes('DESIGN')) {
      return 'bg-amber-900/20 text-amber-500 border-amber-900/50'
    }
    return 'bg-slate-700/20 text-slate-300 border-slate-700/50'
  }

  return (
    <div className="w-80 shrink-0 p-8 flex flex-col h-full overflow-y-auto">
      {/* Properties Section */}
      <div className="mb-8">
        <h3 className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-4">Properties</h3>
        <div className="space-y-4">
          
          {/* Status */}
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
                    <SelectValue>{(v: string) => states.find((s) => s.id === v)?.name ?? v}</SelectValue>
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
          
          {/* Priority */}
          <div className="flex items-center">
            <span className="w-24 text-[13px] text-slate-400">Priority</span>
            <div className="flex-1 flex justify-end">
              <Select
                value={issue.priority}
                onValueChange={(v) => v && void dispatch(updateIssue({ ...scope, payload: { priority: v as IssuePriority } }))}
              >
                <SelectTrigger className="h-8 border-0 bg-transparent shadow-none px-0 text-[13px] text-slate-300 font-medium hover:text-slate-100 w-fit focus:ring-0">
                  <SelectValue>
                    {(v: IssuePriority) => (
                      <span className="flex items-center gap-2">
                        <CustomPriorityIcon priority={v} />
                        {t(`priority.${v}`)}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`priority.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Assignees */}
          <div className="flex items-center">
            <span className="w-24 text-[13px] text-slate-400">Assignees</span>
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-1 cursor-pointer">
                <div className="size-6 rounded-full overflow-hidden bg-slate-700">
                  {issue.author?.avatar_url ? (
                    <img src={issue.author.avatar_url} alt="Assignee" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-[10px] font-bold text-white">
                      {issue.author?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="size-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors">
                  <Plus className="size-3" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Labels */}
          <div className="flex items-start">
            <span className="w-24 text-[13px] text-slate-400 pt-1">Labels</span>
            <div className="flex-1 flex flex-wrap justify-end gap-2">
              {issue.labels?.map((label: any) => (
                <span key={label.id} className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${getLabelColor(label.name)}`}>
                  {label.name}
                </span>
              ))}
              {(!issue.labels || issue.labels.length === 0) && (
                <span className="px-2 py-0.5 rounded-md border border-white/10 bg-white/5 text-[11px] text-slate-400 cursor-pointer hover:bg-white/10">Add</span>
              )}
            </div>
          </div>
          
        </div>
      </div>

      <div className="w-full h-[1px] bg-white/5 mb-8"></div>

      {/* Meta Properties */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-slate-400">
            <Calendar className="size-3.5" /> Due Date
          </div>
          <span className="text-[13px] text-slate-300 font-medium">Nov 24, 2023</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-slate-400">
            <Circle className="size-3.5" /> Estimate
          </div>
          <span className="text-[13px] text-slate-300 font-medium">{issue.estimate_points ?? 5} Points</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-slate-400">
            <Share2 className="size-3.5" /> Parent
          </div>
          <span className="text-[13px] text-indigo-400 font-medium cursor-pointer hover:underline">UI Revamp 2.0</span>
        </div>
      </div>

      <AttachmentsPanel />

      <div className="mt-auto space-y-4 pt-8">
        <button className="flex items-center gap-3 text-[13px] font-medium text-slate-300 hover:text-slate-100 transition-colors w-full">
          <LinkIcon className="size-4 text-slate-500" />
          Copy Link
        </button>
        <button className="flex items-center gap-3 text-[13px] font-medium text-red-400 hover:text-red-300 transition-colors w-full">
          <Trash2 className="size-4" />
          Delete Issue
        </button>
      </div>
    </div>
  )
}

export default function IssueDetailPage() {
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const issue = useAppSelector((state) => state.issue.current)
  const error = useAppSelector((state) => state.issue.error)
  const project = useAppSelector((state) => state.project.items.find((p) => p.id === scope.projectId))

  useEffect(() => {
    if (scope.issueId && scope.projectId) {
      void dispatch(fetchIssue(scope))
      void dispatch(fetchComments(scope))
      void dispatch(fetchActivity(scope))
      void dispatch(fetchRelations(scope))
      void dispatch(fetchAttachments(scope))
      void dispatch(fetchStates({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId }))
      void dispatch(fetchCycles({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId }))
    }
    return () => {
      dispatch(clearCurrentIssue())
    }
  }, [scope.workspaceSlug, scope.projectId, scope.issueId, dispatch])

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
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-12 xl:pr-16 custom-scrollbar">
        <div className="max-w-3xl ml-auto">
          {/* Meta header */}
          <div className="flex items-center gap-2 mb-6 text-[12px] text-slate-500 font-medium">
            <span className="uppercase">{project?.identifier ?? 'PROJ'}-{issue.sequence_id}</span>
            <span>•</span>
            <span>Created {formatRelativeTime(issue.created_at, 'en')}</span>
          </div>

          <h1 className="mb-6 text-3xl font-extrabold text-slate-100 tracking-tight leading-tight">
            {issue.title}
          </h1>
          
          {/* Editor Area */}
          <div className="mb-10">
            <div className="flex items-center gap-5 pb-3 border-b border-white/5 text-slate-400">
              <button className="hover:text-slate-200 transition-colors"><Bold className="size-4" /></button>
              <button className="hover:text-slate-200 transition-colors"><Italic className="size-4" /></button>
              <button className="hover:text-slate-200 transition-colors"><List className="size-4" /></button>
              <button className="hover:text-slate-200 transition-colors"><Code className="size-4" /></button>
              <button className="hover:text-slate-200 transition-colors"><LinkIcon className="size-4" /></button>
              <div className="w-[1px] h-4 bg-white/10 mx-1"></div>
              <button className="hover:text-slate-200 transition-colors"><ImageIcon className="size-4" /></button>
            </div>
            <div className="py-6 text-[14px] text-slate-300 leading-loose whitespace-pre-wrap">
              {issue.description || 'We need to integrate the new WebGL shader components into the main workspace background. The implementation should allow for real-time parameter updates based on user interaction levels.\n\nKey requirements:\n- Performance optimization for mobile devices.\n- Smooth transitions between different shader states.\n- Fallback to static gradients if GPU acceleration is unavailable.'}
            </div>
          </div>

          <RelationsPanel />
          <ActivityTimeline />
        </div>
      </div>

      {/* Right Sidebar Properties */}
      <AttributesRail issue={issue} />
      
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
