import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { FolderKanban, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { createProject } from '@/features/project/projectSlice'

function identifierFromName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 6)
    .toUpperCase()
}

function CreateProjectDialog({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [identifierTouched, setIdentifierTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!identifierTouched) setIdentifier(identifierFromName(value))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(createProject({ workspaceSlug, payload: { name, identifier, description } })).unwrap()
      setOpen(false)
      setName('')
      setIdentifier('')
      setIdentifierTouched(false)
      setDescription('')
    } catch {
      setError(t('projects.createError'))
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
            {t('projects.create')}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="project-name" className="text-sm font-medium">
              {t('projects.name')}
            </label>
            <Input id="project-name" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="project-identifier" className="text-sm font-medium">
              {t('projects.identifier')}
            </label>
            <Input
              id="project-identifier"
              required
              maxLength={6}
              value={identifier}
              onChange={(e) => {
                setIdentifierTouched(true)
                setIdentifier(e.target.value.toUpperCase())
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="project-description" className="text-sm font-medium">
              {t('projects.description')}
            </label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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

export default function ProjectsListPage() {
  const { t } = useTranslation()
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const projects = useAppSelector((state) => state.project.items)
  const isLoading = useAppSelector((state) => state.project.isLoading)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('nav.projects')}</h1>
        {workspaceSlug && <CreateProjectDialog workspaceSlug={workspaceSlug} />}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-12 text-center">
          <FolderKanban className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('projects.empty')}</p>
          {workspaceSlug && <CreateProjectDialog workspaceSlug={workspaceSlug} />}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/w/${workspaceSlug}/p/${project.id}/issues`}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:border-primary"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <FolderKanban className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.identifier}</p>
                </div>
              </div>
              {project.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
