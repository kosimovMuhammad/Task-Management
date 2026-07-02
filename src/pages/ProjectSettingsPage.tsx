import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

function subNavClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  )
}

export default function ProjectSettingsPage() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const base = `/w/${workspaceSlug}/p/${projectId}/settings`

  return (
    <div className="flex gap-8 p-6">
      <nav className="flex w-44 shrink-0 flex-col gap-1">
        <NavLink to={`${base}/general`} className={subNavClass}>
          {t('projectSettings.general')}
        </NavLink>
        <NavLink to={`${base}/members`} className={subNavClass}>
          {t('projectSettings.members')}
        </NavLink>
        <NavLink to={`${base}/states`} className={subNavClass}>
          {t('projectSettings.states')}
        </NavLink>
        <NavLink to={`${base}/labels`} className={subNavClass}>
          {t('projectSettings.labels')}
        </NavLink>
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
