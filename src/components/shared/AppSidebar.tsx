import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { FolderKanban, HelpCircle, MessageSquare, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useAppSelector'

function WorkspaceHeader({ slug }: { slug: string | null }) {
  const { t } = useTranslation()
  const workspace = useAppSelector((state) => state.workspace.current)

  return (
    <Link to={slug ? `/w/${slug}` : '/'} className="flex items-center gap-2 px-1 py-2">
      <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
        {workspace?.name.slice(0, 2).toUpperCase() ?? 'TM'}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{workspace?.name ?? t('app.name')}</p>
        <p className="truncate text-xs text-muted-foreground">{t('nav.workspace')}</p>
      </div>
    </Link>
  )
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  )
}

export function AppSidebar() {
  const { t } = useTranslation()
  const workspace = useAppSelector((state) => state.workspace.current)
  const slug = workspace?.slug ?? null

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col border-r border-border bg-card p-3">
      <WorkspaceHeader slug={slug} />

      <Link
        to={slug ? `/w/${slug}/projects` : '#'}
        aria-disabled={!slug}
        className="my-3 flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        {t('nav.newProject')}
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLink to={slug ? `/w/${slug}/projects` : '#'} className={navLinkClass}>
          <FolderKanban className="size-4" />
          {t('nav.projects')}
        </NavLink>
      </nav>

      <div className="flex flex-col gap-1 border-t border-border pt-2">
        <NavLink to="/settings" className={navLinkClass}>
          <Settings className="size-4" />
          {t('nav.settings')}
        </NavLink>
        <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground">
          <HelpCircle className="size-4" />
          {t('nav.help')}
        </div>
        <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4" />
          {t('nav.feedback')}
        </div>
      </div>
    </aside>
  )
}
