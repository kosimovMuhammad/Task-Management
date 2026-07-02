import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { updateProject } from '@/features/project/projectSlice'

export default function ProjectSettingsGeneralPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const project = useAppSelector((state) => state.project.items.find((p) => p.id === projectId))

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isArchived, setIsArchived] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setDescription(project.description ?? '')
      setIsArchived(project.is_archived)
    }
  }, [project])

  if (!project || !workspaceSlug || !projectId) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaved(false)
    try {
      await dispatch(
        updateProject({ workspaceSlug, projectId, payload: { name, description, is_archived: isArchived } }),
      ).unwrap()
      setSaved(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('projectSettings.generalTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('projectSettings.generalSubtitle')}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="general-name" className="text-sm font-medium">
          {t('projects.name')}
        </label>
        <Input id="general-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('projects.identifier')}</label>
        <Input value={project.identifier} disabled />
        <p className="text-xs text-muted-foreground">{t('projectSettings.identifierHint')}</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="general-description" className="text-sm font-medium">
          {t('projects.description')}
        </label>
        <Textarea id="general-description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-medium">{t('projectSettings.archiveProject')}</p>
          <p className="text-xs text-muted-foreground">{t('projectSettings.archiveHint')}</p>
        </div>
        <input
          type="checkbox"
          checked={isArchived}
          onChange={(e) => setIsArchived(e.target.checked)}
          className="size-4"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('common.save')}
        </Button>
        {saved && <span className="text-sm text-green-500">{t('projectSettings.saved')}</span>}
      </div>
    </form>
  )
}
