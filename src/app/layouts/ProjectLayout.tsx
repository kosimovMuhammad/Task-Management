import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useParams, useNavigate, useLocation } from 'react-router-dom'
import { Bell, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/hooks/useAppSelector'

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'border-b-2 px-1 pb-4 text-sm font-medium transition-colors cursor-pointer',
    isActive ? 'border-indigo-400 text-slate-200' : 'border-transparent text-slate-400 hover:text-slate-200',
  )
}

export function ProjectLayout() {
  const { t } = useTranslation()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const workspace = useAppSelector((state) => state.workspace.current)
  const user = useAppSelector((state) => state.auth.user)
  
  // Since we only have 'issues' right now, we map 'Kanban' and 'List' to issues for this replica
  const location = useLocation()
  const isKanban = location.pathname.includes('/issues') // Treat issues route as Kanban active for the demo

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-6 pt-4 bg-sidebar">
        <div className="flex items-center gap-8">
          <h1 className="text-base font-extrabold text-slate-100 tracking-tight pb-4">
            {workspace?.name ?? 'DeepLogic'}
          </h1>
          
          <nav className="flex gap-6">
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/list`} className={cn('border-b-2 px-1 pb-4 text-sm font-medium transition-colors cursor-pointer border-transparent text-slate-400 hover:text-slate-200')}>
              List
            </NavLink>
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/issues`} className={tabClass}>
              Kanban
            </NavLink>
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/calendar`} className={cn('border-b-2 px-1 pb-4 text-sm font-medium transition-colors cursor-pointer border-transparent text-slate-400 hover:text-slate-200')}>
              Calendar
            </NavLink>
            <NavLink to={`/w/${workspaceSlug}/p/${projectId}/timeline`} className={cn('border-b-2 px-1 pb-4 text-sm font-medium transition-colors cursor-pointer border-transparent text-slate-400 hover:text-slate-200')}>
              Timeline
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-4 pb-4">
          <button className="text-slate-400 hover:text-slate-200 transition-colors">
            <Bell className="size-4" />
          </button>
          <button className="text-slate-400 hover:text-slate-200 transition-colors">
            <HelpCircle className="size-4" />
          </button>
          <div className="size-6 rounded-full overflow-hidden ml-2">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="size-full object-cover" />
            ) : (
              <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="size-full object-cover" />
            )}
          </div>
        </div>
      </div>
      
      {/* Main Board Content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
