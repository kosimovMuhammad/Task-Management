import { useEffect, useState, useRef } from 'react'
import { Search, User, Clock, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setSearchOpen } from '@/features/ui/uiSlice'
import { formatRelativeTime } from '@/lib/formatRelativeTime'

export function GlobalSearchModal() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((state) => state.ui.isSearchOpen)
  
  // Real Redux Data
  const allIssues = useAppSelector((state) => state.issue.items)
  const allProjects = useAppSelector((state) => state.project.items)
  const allMembers = useAppSelector((state) => state.workspace.members)
  const currentUser = useAppSelector((state) => state.auth.user)

  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for Cmd+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        dispatch(setSearchOpen(true))
      }
      if (e.key === 'Escape' && isOpen) {
        dispatch(setSearchOpen(false))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dispatch, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // Filter Data based on query
  const q = query.toLowerCase()
  const filteredIssues = q ? allIssues.filter(i => i.title.toLowerCase().includes(q)) : allIssues.slice(0, 2)
  const filteredProjects = q ? allProjects.filter(p => p.name.toLowerCase().includes(q)) : allProjects.slice(0, 2)
  const filteredMembers = q ? allMembers.filter(m => m.user?.display_name?.toLowerCase().includes(q)) : allMembers.slice(0, 2)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-4xl bg-[#121214] rounded-xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Area */}
        <div className="p-6 pb-2 border-b border-white/5 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 size-5 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issues, projects, members..."
              className="w-full h-14 pl-12 pr-12 bg-transparent border border-white/10 rounded-lg text-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all"
            />
            <div className="absolute right-4 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-medium text-slate-400">
              ⌘ K
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Quick Filters */}
          <div className="w-64 shrink-0 border-r border-white/5 p-6 flex flex-col">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-4">Quick Filters</h3>
            <div className="space-y-1 mb-auto">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-slate-300 rounded-md hover:bg-white/5 transition-colors text-left">
                <User className="size-4 text-slate-400" /> Assigned to me
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-slate-300 rounded-md hover:bg-white/5 transition-colors text-left">
                <div className="size-4 flex items-center justify-center"><div className="size-2 rounded-full border-2 border-slate-400 border-t-indigo-400 transform rotate-45"></div></div> In Progress
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] text-slate-300 rounded-md hover:bg-white/5 transition-colors text-left">
                <LayoutGrid className="size-4 text-slate-400" /> In this project
              </button>
            </div>
            
            {/* Pro Tip */}
            <div className="mt-8 p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[14px]">💡</span>
                <span className="text-[11px] font-bold text-slate-300">Pro Tip</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Use <code className="px-1 py-0.5 rounded bg-white/10 text-slate-300">p:</code> to search only in projects or <code className="px-1 py-0.5 rounded bg-white/10 text-slate-300">@</code> for members.
              </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-8">
            
            {!query && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Recent Searches</h3>
                  <button className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors">Clear all</button>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[12px] text-slate-300 hover:bg-white/10 transition-colors">
                    <Clock className="size-3 text-slate-400" /> api endpoint auth
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[12px] text-slate-300 hover:bg-white/10 transition-colors">
                    <Clock className="size-3 text-slate-400" /> onboarding flow
                  </button>
                </div>
              </div>
            )}

            {/* Issues */}
            {filteredIssues.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-3">Issues</h3>
                <div className="space-y-1">
                  {filteredIssues.map((issue, idx) => (
                    <div key={issue.id} className="flex gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                      <div className="mt-0.5 shrink-0">
                        {idx % 2 === 0 ? (
                          <AlertCircle className="size-4 text-orange-400" />
                        ) : (
                          <CheckCircle2 className="size-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-slate-200 truncate">{issue.title}</span>
                          <span className="text-[11px] text-slate-500 group-hover:text-slate-400">LOG-{issue.sequence_id}</span>
                        </div>
                        <p className="text-[12px] text-slate-400 truncate mb-2">
                          {issue.description || 'No description provided.'}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1.5"><LayoutGrid className="size-3" /> {issue.project_id ? 'Infrastructure' : 'Design'}</span>
                          <span><Clock className="size-3 inline mr-1" /> Updated {formatRelativeTime(issue.updated_at, i18n.language)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects & Members Row */}
            <div className="grid grid-cols-2 gap-8">
              {/* Projects */}
              {filteredProjects.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-3">Projects</h3>
                  <div className="space-y-1">
                    {filteredProjects.map((proj) => (
                      <div key={proj.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                        <div className={`size-8 rounded flex items-center justify-center text-xs font-bold text-white ${proj.name.includes('Core') ? 'bg-orange-600' : 'bg-indigo-600'}`}>
                          {proj.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-slate-200">{proj.name}</span>
                          <span className="text-[11px] text-slate-500">{proj.identifier} Services</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members */}
              {filteredMembers.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-3">Members</h3>
                  <div className="space-y-1">
                    {filteredMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                        <div className="size-8 rounded-full overflow-hidden bg-slate-700">
                          {member.user?.avatar_url ? (
                            <img src={member.user.avatar_url} alt="Profile" className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-xs font-bold text-white bg-indigo-500">
                              {member.user?.display_name?.slice(0, 2).toUpperCase() ?? '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-slate-200">{member.user?.display_name}</span>
                          <span className="text-[11px] text-slate-500 capitalize">{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Empty State */}
            {query && filteredIssues.length === 0 && filteredProjects.length === 0 && filteredMembers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Search className="size-8 mb-4 opacity-50" />
                <p className="text-[13px]">No results found for "{query}"</p>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 bg-[#0d0d0f]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-sans">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-sans">↵</kbd> to select</span>
            <span className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-white/10 text-[9px] font-sans">esc</kbd> to close</span>
          </div>
          <div className="font-medium">
            Search powered by <span className="font-bold tracking-widest text-slate-400 ml-1">DEEP LOGIC</span>
          </div>
        </div>
      </div>

      {/* Close when clicking outside */}
      <div className="absolute inset-0 z-[-1]" onClick={() => dispatch(setSearchOpen(false))}></div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
