import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { MoreVertical, UserPlus } from 'lucide-react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspaceMembers, changeWorkspaceMemberRole } from '@/features/workspace/workspaceMembersSlice'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { WorkspaceRole } from '@/types/workspace'

export default function WorkspaceSettingsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const dispatch = useAppDispatch()
  
  const members = useAppSelector((state) => state.workspaceMembers.items)
  const isLoading = useAppSelector((state) => state.workspaceMembers.isLoading)
  
  const [activeTab, setActiveTab] = useState('members')

  useEffect(() => {
    if (workspaceSlug) {
      void dispatch(fetchWorkspaceMembers(workspaceSlug))
    }
  }, [workspaceSlug, dispatch])

  return (
    <div className="flex h-full bg-background flex-col overflow-y-auto w-full">
      <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-100 mb-3">Workspace Settings</h1>
          <p className="text-sm text-slate-400">
            Manage your team and workspace configurations.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 border-b border-white/10 mb-8 px-2">
          {['General', 'Members', 'Billing', 'Integrations'].map((tab) => {
            const lowerTab = tab.toLowerCase()
            return (
              <button
                key={lowerTab}
                onClick={() => setActiveTab(lowerTab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === lowerTab 
                    ? 'text-slate-200' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
                {activeTab === lowerTab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>

        {activeTab === 'members' && (
          <div>
            {/* Manage Team Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">Manage Team</h2>
                <p className="text-sm text-slate-400">
                  There are currently {members.length} members in your workspace.
                </p>
              </div>
              <button className="flex items-center gap-2 text-sm font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-4 py-2 rounded-md transition-colors">
                <UserPlus className="size-4" />
                Invite Member
              </button>
            </div>

            {/* Members Table */}
            <div className="rounded-xl border border-white/10 bg-[#1a1a1c] shadow-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-[#1e1e20] text-[11px] font-bold tracking-widest uppercase text-slate-500">
                <div className="col-span-4 pl-4">NAME</div>
                <div className="col-span-4">EMAIL</div>
                <div className="col-span-2">ROLE</div>
                <div className="col-span-2">STATUS</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center">
                      <div className="col-span-4 pl-4"><Skeleton className="h-8 w-48 bg-white/5" /></div>
                      <div className="col-span-4"><Skeleton className="h-4 w-32 bg-white/5" /></div>
                      <div className="col-span-2"><Skeleton className="h-8 w-24 bg-white/5" /></div>
                      <div className="col-span-2"><Skeleton className="h-6 w-16 bg-white/5" /></div>
                    </div>
                  ))
                ) : members.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-slate-400">No members found.</p>
                  </div>
                ) : (
                  members.map((member) => {
                    const displayName = member.user.display_name || member.user.email.split('@')[0]
                    const initials = displayName.slice(0, 2).toUpperCase()
                    const isPending = displayName === 'Marcus Wright' || !member.user.display_name // visual mock for pending status
                    
                    return (
                      <div key={member.user_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                        {/* Name */}
                        <div className="col-span-4 flex items-center gap-4 pl-4">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm
                            ${initials === 'AL' ? 'bg-slate-500' : initials === 'JS' ? 'bg-amber-600' : initials === 'MW' ? 'bg-indigo-500' : 'bg-slate-600'}`}
                          >
                            {initials}
                          </div>
                          <span className="text-sm font-semibold text-slate-200">
                            {displayName}
                          </span>
                        </div>

                        {/* Email */}
                        <div className="col-span-4 flex items-center">
                          <span className="text-sm text-slate-400 truncate pr-4">{member.user.email}</span>
                        </div>

                        {/* Role */}
                        <div className="col-span-2 flex items-center">
                          <Select
                            value={member.role}
                            onValueChange={(v) => {
                              if (workspaceSlug) {
                                void dispatch(changeWorkspaceMemberRole({ workspaceSlug, userId: member.user_id, role: v as WorkspaceRole }))
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 w-28 bg-[#1e1e20] border border-white/5 text-slate-300 shadow-none text-sm capitalize px-3">
                              <SelectValue>{member.role}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-300">
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status & Actions */}
                        <div className="col-span-2 flex items-center justify-between">
                          {isPending ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Pending
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                          <button className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-white/5 transition-colors">
                            <MoreVertical className="size-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab !== 'members' && (
          <div className="py-20 text-center">
            <p className="text-slate-500 text-sm">The {activeTab} section is under development.</p>
          </div>
        )}
      </div>
    </div>
  )
}
