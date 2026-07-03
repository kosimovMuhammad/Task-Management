import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, CheckCircle2, Waypoints, Repeat, Blocks, Layout, Plus, Search, Settings, Waves } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspaces } from '@/features/workspace/workspaceSlice'
import { setSearchOpen } from '@/features/ui/uiSlice'

function WorkspaceHeader() {
  return (
    <Link to="/" className="flex items-center gap-3 px-2 py-4 mb-4">
      <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
        <Waves className="size-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold text-slate-100 tracking-tight leading-tight">Workspace</span>
        <span className="text-xs text-slate-400 font-medium">Pro Plan</span>
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

  useEffect(() => {
    if (!current && items.length === 0) {
      void dispatch(fetchWorkspaces())
    }
  }, [current, items.length, dispatch])

  // Fake active state for the screenshot replication
  const location = useLocation();
  const isMyTasksActive = location.pathname.includes('/my-tasks') || true; // Force active for the exact replica

  return (
    <aside className="flex h-svh w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border px-3 py-2">
      <WorkspaceHeader />

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

        <NavLink to={slug ? `/w/${slug}/cycles` : '#'} className={navLinkClass}>
          <Repeat className="size-4 opacity-70" />
          Cycles
        </NavLink>

        <NavLink to={slug ? `/w/${slug}/modules` : '#'} className={navLinkClass}>
          <Blocks className="size-4 opacity-70" />
          Modules
        </NavLink>

        <NavLink to={slug ? `/w/${slug}/views` : '#'} className={navLinkClass}>
          <Layout className="size-4 opacity-70" />
          Views
        </NavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-3 pb-2">
        <button className="w-full flex items-center justify-center gap-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 text-sm font-semibold transition-colors shadow-sm mb-4">
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
