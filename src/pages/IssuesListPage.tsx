import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Plus, Search, Filter, User, Tag, Calendar, ChevronUp, ChevronRight, ChevronsUp, AlertCircle, Circle, ArrowUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchStates } from '@/features/state/stateSlice'
import { fetchIssues } from '@/features/issue/issueSlice'
import type { Issue, IssuePriority } from '@/types/issue'

// Helper to render linear-style priority icons
function CustomPriorityIcon({ priority }: { priority: IssuePriority }) {
  switch (priority) {
    case 'urgent':
      return <AlertCircle className="size-3.5 text-red-500" />
    case 'high':
      return <ChevronsUp className="size-3.5 text-orange-400" />
    case 'medium':
      return <ChevronUp className="size-3.5 text-yellow-400" />
    case 'low':
      return <ChevronRight className="size-3.5 text-slate-400" />
    case 'none':
    default:
      return null
  }
}

// Generate deterministic beautiful label colors
function getLabelColor(name: string) {
  const normalized = name.toUpperCase()
  if (normalized.includes('SECURITY') || normalized.includes('FEATURE')) {
    return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20'
  }
  if (normalized.includes('BACKEND') || normalized.includes('DOCS')) {
    return 'bg-slate-500/20 text-slate-300 border-slate-500/20'
  }
  if (normalized.includes('DESIGN') || normalized.includes('UI/UX')) {
    return 'bg-amber-500/20 text-amber-500 border-amber-500/20'
  }
  return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
}

function IssueCard({
  issue,
  workspaceSlug,
  projectId,
  identifier,
}: {
  issue: Issue
  workspaceSlug: string
  projectId: string
  identifier: string
}) {
  return (
    <Link
      to={`/w/${workspaceSlug}/p/${projectId}/issues/${issue.id}`}
      className="block space-y-3 rounded-lg border border-white/5 bg-[#1e1e20] p-4 hover:border-white/10 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between text-xs text-slate-400">
        <span className="font-medium">
          {identifier}-{issue.sequence_id}
        </span>
        {issue.priority && <CustomPriorityIcon priority={issue.priority} />}
      </div>
      
      <p className="text-[13px] font-medium text-slate-200 leading-snug">{issue.title}</p>
      
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {issue.labels.map((label) => (
            <span
              key={label.id}
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${getLabelColor(label.name)}`}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Calendar className="size-3.5" />
          <span className="text-[11px] font-medium">
            {issue.due_date ? new Date(issue.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Tomorrow'}
          </span>
        </div>
        
        {/* Assignee Avatar */}
        <div className="size-5 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center border border-[#1e1e20] ring-1 ring-white/5">
          {issue.assignees?.[0]?.avatar_url ? (
            <img src={issue.assignees[0].avatar_url} alt="Assignee" className="size-full object-cover" />
          ) : issue.assignees?.[0]?.display_name ? (
            <span className="text-[9px] font-bold text-white">{issue.assignees[0].display_name.slice(0, 2).toUpperCase()}</span>
          ) : (
            <img src={`https://i.pravatar.cc/150?u=${issue.id}`} alt="Assignee" className="size-full object-cover" />
          )}
        </div>
      </div>
    </Link>
  )
}

export default function IssuesListPage() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const dispatch = useAppDispatch()
  
  const states = useAppSelector((state) => state.state.items)
  const statesLoading = useAppSelector((state) => state.state.isLoading)
  const issues = useAppSelector((state) => state.issue.items)
  const issuesLoading = useAppSelector((state) => state.issue.isLoading)
  const project = useAppSelector((s) => s.project.items.find((p) => p.id === projectId))
  
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    void dispatch(fetchStates({ workspaceSlug, projectId }))
  }, [workspaceSlug, projectId, dispatch])

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    const handle = setTimeout(() => {
      void dispatch(
        fetchIssues({
          workspaceSlug,
          projectId,
          filters: { search: search || undefined },
        }),
      )
    }, 300)
    return () => clearTimeout(handle)
  }, [workspaceSlug, projectId, search, dispatch])

  const columns = useMemo(() => {
    return [...states]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ state: s, issues: issues.filter((i) => i.state_id === s.id) }))
  }, [states, issues])

  if (!workspaceSlug || !projectId) return null

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-sidebar-border px-6 py-3 shrink-0">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter issues..."
            className="h-8 w-64 pl-9 bg-[#1a1a1c] border-white/5 text-sm text-slate-300 focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 text-[13px] font-medium text-slate-300 bg-transparent border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
            <Filter className="size-3.5 text-slate-400" />
            Status
          </button>
          <button className="flex items-center gap-2 text-[13px] font-medium text-slate-300 bg-transparent border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
            <User className="size-3.5 text-slate-400" />
            Assignee
          </button>
          <button className="flex items-center gap-2 text-[13px] font-medium text-slate-300 bg-transparent border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
            <Tag className="size-3.5 text-slate-400" />
            Labels
          </button>
        </div>
        
        <div className="flex-1" />
        
        <div className="flex items-center text-[13px]">
          <span className="text-slate-500 mr-2">Sorted by</span>
          <span className="text-slate-300 font-medium">Manual</span>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {statesLoading ? (
          <div className="flex gap-6 h-full">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-80 shrink-0 space-y-4">
                <Skeleton className="h-4 w-32 bg-white/5" />
                <Skeleton className="h-32 w-full bg-[#1a1a1c] rounded-lg" />
                <Skeleton className="h-32 w-full bg-[#1a1a1c] rounded-lg" />
              </div>
            ))}
          </div>
        ) : states.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
            <p>No states configured for this project.</p>
          </div>
        ) : (
          <div className="flex gap-6 h-full">
            {columns.map(({ state, issues: stateIssues }) => {
              // Custom column icon based on name
              const stateName = state.name.toUpperCase()
              let StateIcon = Circle
              let iconColor = "text-slate-400"
              
              if (stateName.includes('TODO')) {
                iconColor = "text-slate-400"
              } else if (stateName.includes('IN PROGRESS')) {
                iconColor = "text-indigo-400"
              } else if (stateName.includes('BACKLOG')) {
                iconColor = "text-slate-500"
              } else if (stateName.includes('DONE')) {
                iconColor = "text-emerald-400"
              }

              return (
                <div key={state.id} className="w-[340px] shrink-0 flex flex-col h-full">
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                    <div className="flex items-center gap-2 text-[12px] font-bold tracking-widest text-slate-300">
                      <StateIcon className={`size-3.5 ${iconColor}`} />
                      <span className="uppercase">{state.name}</span>
                      <span className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-400 font-medium">
                        {stateIssues.length}
                      </span>
                    </div>
                    <button className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                      <Plus className="size-4" />
                    </button>
                  </div>
                  
                  {/* Column Body (Cards) */}
                  <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-2 custom-scrollbar">
                    {issuesLoading && stateIssues.length === 0 ? (
                      <Skeleton className="h-32 w-full bg-[#1e1e20] rounded-lg border border-white/5" />
                    ) : (
                      stateIssues.map((issue) => (
                        <IssueCard
                          key={issue.id}
                          issue={issue}
                          workspaceSlug={workspaceSlug}
                          projectId={projectId}
                          identifier={project?.identifier ?? 'ISSUE'}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
