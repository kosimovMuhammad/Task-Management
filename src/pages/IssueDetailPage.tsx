import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Paperclip, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PriorityIcon } from '@/components/shared/PriorityIcon'
import { NotFound } from '@/components/shared/NotFound'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchStates } from '@/features/state/stateSlice'
import { fetchCycles, addIssuesToCycle } from '@/features/cycle/cycleSlice'
import { formatRelativeTime } from '@/lib/formatRelativeTime'
import {
  addComment,
  clearCurrentIssue,
  createRelation,
  deleteAttachment,
  deleteComment,
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

function useIssueScope() {
  const { workspaceSlug, projectId, issueId } = useParams<{
    workspaceSlug: string
    projectId: string
    issueId: string
  }>()
  return { workspaceSlug: workspaceSlug ?? '', projectId: projectId ?? '', issueId: issueId ?? '' }
}

function CommentsPanel() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const comments = useAppSelector((state) => state.issue.comments)
  const user = useAppSelector((state) => state.auth.user)
  const [body, setBody] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {comment.author?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{comment.author?.display_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(comment.created_at, i18n.language)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2 rounded-lg bg-card p-3 text-sm">
              <p className="whitespace-pre-wrap">{comment.body}</p>
              {comment.author_id === user?.id && (
                <button
                  onClick={() => void dispatch(deleteComment({ ...scope, commentId: comment.id }))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {comments.length === 0 && <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>}

      <form onSubmit={(e) => void handleSubmit(e)} className="flex gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('issueDetail.addComment')}
          className="min-h-16"
        />
        <Button type="submit" size="icon" disabled={isSubmitting || !body.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  )
}

function ActivityPanel() {
  const { t } = useTranslation()
  const activity = useAppSelector((state) => state.issue.activity)

  if (activity.length === 0) return <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>

  return (
    <ul className="space-y-2 text-sm">
      {activity.map((entry) => (
        <li key={entry.id} className="rounded-lg bg-card p-3 text-xs text-muted-foreground">
          {typeof entry.description === 'string' ? entry.description : JSON.stringify(entry)}
        </li>
      ))}
    </ul>
  )
}

function RelationsPanel() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const relations = useAppSelector((state) => state.issue.relations)
  const [relatedId, setRelatedId] = useState('')
  const [relationType, setRelationType] = useState<RelationType>('relates_to')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!relatedId.trim()) return
    setIsSubmitting(true)
    try {
      await dispatch(createRelation({ ...scope, relatedIssueId: relatedId.trim(), relationType })).unwrap()
      setRelatedId('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {RELATION_TYPES.map((type) => {
        const items = relations?.[type] ?? []
        if (items.length === 0) return null
        return (
          <div key={type}>
            <h4 className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              {t(`issueDetail.relation.${type}`)}
            </h4>
            <ul className="space-y-1">
              {items.map((rel) => (
                <li key={rel.id} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm">
                  <span>{rel.related_issue?.title ?? rel.related_issue_id}</span>
                  <button
                    onClick={() => void dispatch(deleteRelation({ ...scope, linkId: rel.id }))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      {relations && RELATION_TYPES.every((type) => (relations[type]?.length ?? 0) === 0) && (
        <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
      )}

      <form onSubmit={(e) => void handleAdd(e)} className="flex gap-2">
        <Select value={relationType} onValueChange={(v) => v && setRelationType(v as RelationType)}>
          <SelectTrigger className="w-36">
            <SelectValue>{(v: RelationType) => t(`issueDetail.relation.${v}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RELATION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`issueDetail.relation.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          value={relatedId}
          onChange={(e) => setRelatedId(e.target.value)}
          placeholder={t('issueDetail.relatedIssueId')}
          className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        />
        <Button type="submit" disabled={isSubmitting || !relatedId.trim()}>
          {t('common.create')}
        </Button>
      </form>
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
    <div className="space-y-3">
      {attachments.map((a) => (
        <div key={a.id} className="flex items-center justify-between rounded-lg bg-card px-3 py-2 text-sm">
          <a href={a.download_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline">
            <Paperclip className="size-3.5" />
            {a.file_name}
            <span className="text-xs text-muted-foreground">({Math.round(a.file_size / 1024)} KB)</span>
          </a>
          <button
            onClick={() => void dispatch(deleteAttachment({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId, attachmentId: a.id }))}
            className="text-muted-foreground hover:text-destructive"
            aria-label={t('common.delete')}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      {attachments.length === 0 && <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>}

      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary">
        <Paperclip className="size-4" />
        {isUploading ? t('common.loading') : t('issueDetail.uploadFile')}
        <input
          type="file"
          className="hidden"
          disabled={isUploading}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </label>
    </div>
  )
}

function AttributesRail() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const issue = useAppSelector((state) => state.issue.current)
  const states = useAppSelector((state) => state.state.items)
  const cycles = useAppSelector((state) => state.cycle.items)

  if (!issue) return null

  return (
    <div className="w-72 shrink-0 space-y-4 border-l border-border p-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('issueDetail.attributes')}</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('issues.state')}</span>
            <Select
              value={issue.state_id}
              onValueChange={(v) => v && void dispatch(updateIssue({ ...scope, payload: { state_id: v } }))}
            >
              <SelectTrigger size="sm">
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
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('issues.priority')}</span>
            <Select
              value={issue.priority}
              onValueChange={(v) => v && void dispatch(updateIssue({ ...scope, payload: { priority: v as IssuePriority } }))}
            >
              <SelectTrigger size="sm">
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
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('issueDetail.cycle')}</span>
            <Select
              value=""
              onValueChange={(v) => v && void dispatch(addIssuesToCycle({ ...scope, cycleId: v, issueIds: [scope.issueId] }))}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder={t('issueDetail.noneSet')} />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('issueDetail.labels')}</h3>
        <div className="flex flex-wrap gap-1.5">
          {issue.labels.map((label) => (
            <span key={label.id} className="rounded bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {label.name}
            </span>
          ))}
          {issue.labels.length === 0 && <span className="text-xs text-muted-foreground">{t('issueDetail.noneSet')}</span>}
        </div>
      </div>

      <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <p>
          {t('issueDetail.created')}: {new Date(issue.created_at).toLocaleDateString()}
        </p>
        <p>
          {t('issueDetail.updated')}: {new Date(issue.updated_at).toLocaleDateString()}
        </p>
        {issue.estimate_points != null && (
          <p>
            {t('issueDetail.estimate')}: {issue.estimate_points}
          </p>
        )}
      </div>
    </div>
  )
}

export default function IssueDetailPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const scope = useIssueScope()
  const issue = useAppSelector((state) => state.issue.current)
  const error = useAppSelector((state) => state.issue.error)
  const project = useAppSelector((state) => state.project.items.find((p) => p.id === scope.projectId))

  useEffect(() => {
    void dispatch(fetchIssue(scope))
    void dispatch(fetchComments(scope))
    void dispatch(fetchActivity(scope))
    void dispatch(fetchRelations(scope))
    void dispatch(fetchAttachments(scope))
    void dispatch(fetchStates({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId }))
    void dispatch(fetchCycles({ workspaceSlug: scope.workspaceSlug, projectId: scope.projectId }))
    return () => {
      dispatch(clearCurrentIssue())
    }
  }, [scope.workspaceSlug, scope.projectId, scope.issueId, dispatch])

  if (error) {
    return <NotFound />
  }

  if (!issue || issue.id !== scope.issueId) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 text-sm text-muted-foreground">
          <Link to={`/w/${scope.workspaceSlug}/projects`} className="hover:text-foreground">
            {t('nav.projects')}
          </Link>
          {' / '}
          <Link to={`/w/${scope.workspaceSlug}/p/${scope.projectId}/issues`} className="hover:text-foreground">
            {project?.name}
          </Link>
          {' / '}
          <span>
            {project?.identifier}-{issue.sequence_id}
          </span>
        </div>

        <h1 className="mb-4 text-2xl font-semibold">{issue.title}</h1>
        {issue.description && <p className="mb-6 whitespace-pre-wrap text-sm text-muted-foreground">{issue.description}</p>}

        <Tabs defaultValue="comments">
          <TabsList>
            <TabsTrigger value="comments">{t('issueDetail.comments')}</TabsTrigger>
            <TabsTrigger value="history">{t('issueDetail.history')}</TabsTrigger>
            <TabsTrigger value="relations">{t('issueDetail.relations')}</TabsTrigger>
            <TabsTrigger value="attachments">{t('issueDetail.attachments')}</TabsTrigger>
          </TabsList>
          <TabsContent value="comments">
            <CommentsPanel />
          </TabsContent>
          <TabsContent value="history">
            <ActivityPanel />
          </TabsContent>
          <TabsContent value="relations">
            <RelationsPanel />
          </TabsContent>
          <TabsContent value="attachments">
            <AttachmentsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <AttributesRail />
    </div>
  )
}
