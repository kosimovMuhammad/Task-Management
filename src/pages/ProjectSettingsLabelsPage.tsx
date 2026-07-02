import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { createLabel, deleteLabel, fetchLabels } from '@/features/label/labelSlice'
import { apiClient } from '@/lib/apiClient'
import type { IssueListResponse } from '@/types/issue'

const DEFAULT_COLOR = '#3b82f6'

function CreateLabelDialog({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await dispatch(createLabel({ workspaceSlug, projectId, payload: { name, color } })).unwrap()
      setOpen(false)
      setName('')
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
            {t('projectSettings.createLabel')}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projectSettings.createLabel')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="label-name" className="text-sm font-medium">
              {t('projects.name')}
            </label>
            <Input id="label-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="label-color" className="text-sm font-medium">
              {t('projectSettings.color')}
            </label>
            <Input id="label-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 p-1" />
          </div>
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

function useLabelIssueCount(workspaceSlug: string, projectId: string, labelId: string) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    apiClient
      .get<IssueListResponse>(`/workspaces/${workspaceSlug}/projects/${projectId}/issues/`, {
        // Backend 400s on a single bare `label=` value (ajv oneOf ambiguity) — `label[]=` forces
        // the unambiguous array form. See issueSlice.ts's toIssueQueryParams for the same fix.
        params: { 'label[]': labelId },
      })
      .then((res) => {
        if (!cancelled) setCount(res.data.data.length)
      })
      .catch(() => {
        if (!cancelled) setCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceSlug, projectId, labelId])

  return count
}

function LabelRow({
  labelId,
  name,
  color,
  workspaceSlug,
  projectId,
  onDelete,
}: {
  labelId: string
  name: string
  color: string
  workspaceSlug: string
  projectId: string
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const count = useLabelIssueCount(workspaceSlug, projectId, labelId)

  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
          {name}
        </span>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {count !== null ? t('projectSettings.issuesCount', { count }) : '…'}
      </TableCell>
      <TableCell className="text-right">
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive" aria-label={t('common.delete')}>
          <Trash2 className="size-4" />
        </button>
      </TableCell>
    </TableRow>
  )
}

export default function ProjectSettingsLabelsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const labels = useAppSelector((state) => state.label.items)
  const isLoading = useAppSelector((state) => state.label.isLoading)

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    void dispatch(fetchLabels({ workspaceSlug, projectId }))
  }, [workspaceSlug, projectId, dispatch])

  if (!workspaceSlug || !projectId) return null

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('projectSettings.labels')}</h2>
          <p className="text-sm text-muted-foreground">{t('projectSettings.labelsSubtitle')}</p>
        </div>
        <CreateLabelDialog workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dashboard.title')}</TableHead>
              <TableHead className="text-right">{t('cycles.issues')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.map((label) => (
              <LabelRow
                key={label.id}
                labelId={label.id}
                name={label.name}
                color={label.color}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                onDelete={() => void dispatch(deleteLabel({ workspaceSlug, projectId, labelId: label.id }))}
              />
            ))}
            {labels.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
