import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { createState, deleteState, fetchStates } from '@/features/state/stateSlice'
import type { StateGroup } from '@/types/state'

const GROUPS: StateGroup[] = ['backlog', 'unstarted', 'started', 'completed', 'cancelled']
const DEFAULT_COLOR = '#3b82f6'

function CreateStateDialog({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [group, setGroup] = useState<StateGroup>('unstarted')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await dispatch(createState({ workspaceSlug, projectId, payload: { name, color, group } })).unwrap()
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
            {t('projectSettings.createState')}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projectSettings.createState')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="state-name" className="text-sm font-medium">
              {t('projects.name')}
            </label>
            <Input id="state-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="state-color" className="text-sm font-medium">
                {t('projectSettings.color')}
              </label>
              <Input id="state-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 p-1" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('projectSettings.group')}</label>
              <Select value={group} onValueChange={(v) => v && setGroup(v as StateGroup)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: StateGroup) => t(`projectSettings.stateGroup.${v}`)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {t(`projectSettings.stateGroup.${g}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

export default function ProjectSettingsStatesPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const states = useAppSelector((state) => state.state.items)
  const isLoading = useAppSelector((state) => state.state.isLoading)

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    void dispatch(fetchStates({ workspaceSlug, projectId }))
  }, [workspaceSlug, projectId, dispatch])

  if (!workspaceSlug || !projectId) return null

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('projectSettings.states')}</h2>
          <p className="text-sm text-muted-foreground">{t('projectSettings.statesSubtitle')}</p>
        </div>
        <CreateStateDialog workspaceSlug={workspaceSlug} projectId={projectId} />
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {[...states]
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">
                    {t(`projectSettings.stateGroup.${s.group}`)}
                  </span>
                  {s.is_default && (
                    <span className="text-[11px] text-muted-foreground">{t('projectSettings.default')}</span>
                  )}
                </div>
                <button
                  onClick={() => void dispatch(deleteState({ workspaceSlug, projectId, stateId: s.id }))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          {states.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('common.noResults')}</p>
          )}
        </div>
      )}
    </div>
  )
}
