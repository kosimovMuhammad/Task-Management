import { useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LayoutGrid, CheckCircle2, Waypoints, Repeat, Blocks, Plus, Search, Settings, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspaces } from '@/features/workspace/workspaceSlice'
import { setSearchOpen, setCreateIssueOpen } from '@/features/ui/uiSlice'

function WorkspaceHeader({ name, slug }: { name: string; slug: string | null }) {
  return (
    <Link to={slug ? `/w/${slug}` : '/'} className="flex items-center gap-3 px-2 py-4 mb-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <Waves className="size-5" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-bold text-slate-100 tracking-tight leading-tight">{name}</span>
      </div>
    </Link>
  )
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
    isActive 
      ? 'bg-indigo-500/10 text-indigo-400 font-semibold' 
      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
  )
}

export function AppSidebar() {
  const dispatch = useAppDispatch()
  const current = useAppSelector((state) => state.workspace.current)
  const items = useAppSelector((state) => state.workspace.items)
  const slug = current?.slug ?? items[0]?.slug ?? null
  const lastProjectId = useAppSelector((state) => state.ui.lastProjectId)

  useEffect(() => {
    if (!current && items.length === 0) {
      void dispatch(fetchWorkspaces())
    }
  }, [current, items.length, dispatch])

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border px-3 py-2">
      <WorkspaceHeader name={current?.name ?? 'Workspace'} slug={slug} />

      <nav className="flex flex-1 flex-col gap-0.5">
        <NavLink end to={slug ? `/w/${slug}` : '/'} className={navLinkClass}>
          <LayoutGrid className="size-4 opacity-70" />
          Dashboard
        </NavLink>

        <NavLink to={slug ? `/w/${slug}/my-tasks` : '#'} className={navLinkClass}>
          <CheckCircle2 className="size-4 opacity-70" />
          My Tasks
        </NavLink>

        <NavLink to={slug ? `/w/${slug}/projects` : '#'} className={navLinkClass}>
          <Waypoints className="size-4 opacity-70" />
          Projects
        </NavLink>

        <NavLink to={slug ? (lastProjectId ? `/w/${slug}/p/${lastProjectId}/cycles` : `/w/${slug}/projects`) : '#'} className={navLinkClass}>
          <Repeat className="size-4 opacity-70" />
          Cycles
        </NavLink>

        <NavLink to={slug ? (lastProjectId ? `/w/${slug}/p/${lastProjectId}/modules` : `/w/${slug}/projects`) : '#'} className={navLinkClass}>
          <Blocks className="size-4 opacity-70" />
          Modules
        </NavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-3 pb-2">
        <button
          onClick={() => dispatch(setCreateIssueOpen(true))}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 text-sm font-semibold transition-colors shadow-sm mb-4"
        >
          <Plus className="size-4" />
          Create Issue
        </button>

        <div className="flex flex-col gap-0.5">
          <button 
            onClick={() => dispatch(setSearchOpen(true))}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
          >
            <Search className="size-4 opacity-70" />
            Search
          </button>
          
          <NavLink to={slug ? `/w/${slug}/settings` : '/settings'} className={navLinkClass}>
            <Settings className="size-4 opacity-70" />
            Settings
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
