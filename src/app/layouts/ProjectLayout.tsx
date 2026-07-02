import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useAppSelector'

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'border-b-2 px-1 pb-2 text-sm font-medium transition-colors',
    isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
  )
}

export function ProjectLayout() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const project = useAppSelector((state) => state.project.items.find((p) => p.id === projectId))

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 pt-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-primary/15 text-primary">
            <FolderKanban className="size-3.5" />
          </div>
          <h1 className="text-base font-semibold">{project?.name ?? '…'}</h1>
        </div>
        <nav className="flex gap-5">
          <NavLink to={`/w/${workspaceSlug}/p/${projectId}/issues`} className={tabClass}>
            {t('nav.issues')}
          </NavLink>
          <NavLink to={`/w/${workspaceSlug}/p/${projectId}/cycles`} className={tabClass}>
            {t('nav.cycles')}
          </NavLink>
          <NavLink to={`/w/${workspaceSlug}/p/${projectId}/settings`} className={tabClass}>
            {t('nav.settings')}
          </NavLink>
        </nav>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
