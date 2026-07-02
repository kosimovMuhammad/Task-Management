import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { createWorkspace } from '@/features/workspace/workspaceSlice'

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function CreateWorkspacePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const workspace = await dispatch(createWorkspace({ name, slug })).unwrap()
      navigate(`/w/${workspace.slug}`, { replace: true })
    } catch {
      setError(t('workspace.createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4 text-foreground">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">{t('workspace.createTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('workspace.createSubtitle')}</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ws-name" className="text-sm font-medium">
            {t('workspace.name')}
          </label>
          <Input id="ws-name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="ws-slug" className="text-sm font-medium">
            {t('workspace.slug')}
          </label>
          <Input
            id="ws-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('workspace.createSubmit')}
        </Button>
      </form>
    </div>
  )
}
