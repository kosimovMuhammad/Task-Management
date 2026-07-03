import { Suspense, useEffect } from 'react'
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom'
import { Bell, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setLastProjectId } from '@/features/ui/uiSlice'
import { Loader } from '@/components/shared/Loader'

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'border-b-2 px-1 pb-4 text-sm font-medium transition-colors cursor-pointer',
    isActive ? 'border-indigo-400 text-slate-200' : 'border-transparent text-slate-400 hover:text-slate-200',
  )
}

export function ProjectLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const workspace = useAppSelector((state) => state.workspace.current)
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    if (projectId) dispatch(setLastProjectId(projectId))
  }, [projectId, dispatch])

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-6 pt-4 bg-sidebar">
        <div className="flex items-center gap-8">
          <h1 className="text-base font-extrabold text-slate-100 tracking-tight pb-4">
            {workspace?.name ?? 'DeepLogic'}
          </h1>
          
          <nav className="flex gap-6">
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/issues`} className={tabClass}>
              Kanban
            </NavLink>
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/cycles`} className={tabClass}>
              Cycles
            </NavLink>
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/modules`} className={tabClass}>
              Modules
            </NavLink>
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/settings`} className={tabClass}>
              Settings
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4 pb-4">
          <button
            onClick={() => navigate(`/w/${workspaceSlug}/notifications`)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Bell className="size-4" />
          </button>
          <button className="text-slate-400 hover:text-slate-200 transition-colors">
            <HelpCircle className="size-4" />
          </button>
          <div className="size-6 rounded-full overflow-hidden ml-2 bg-slate-700 flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.display_name} className="size-full object-cover" />
            ) : (
              <span className="text-[9px] font-bold text-white">{(user?.display_name ?? '?').slice(0, 2).toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Board Content */}
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
