import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MoreVertical, UserPlus } from 'lucide-react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import {
  fetchWorkspaceMembers,
  changeWorkspaceMemberRole,
  removeWorkspaceMember,
  inviteWorkspaceMember,
} from '@/features/workspace/workspaceMembersSlice'
import { updateWorkspace, deleteWorkspace } from '@/features/workspace/workspaceSlice'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { WorkspaceRole } from '@/types/workspace'

const AVATAR_COLORS = ['bg-indigo-500', 'bg-amber-600', 'bg-emerald-600', 'bg-slate-500', 'bg-rose-500', 'bg-cyan-600']

function avatarColor(seed: string) {
  const sum = seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function InviteMemberDialog({ workspaceSlug }: { workspaceSlug: string }) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('member')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await dispatch(inviteWorkspaceMember({ workspaceSlug, email, role })).unwrap()
      toast.success(`Invite sent to ${email}`)
      setOpen(false)
      setEmail('')
      setRole('member')
    } catch {
      toast.error('Failed to send invite')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex items-center gap-2 text-sm font-semibold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-4 py-2 rounded-md transition-colors">
            <UserPlus className="size-4" />
            Invite Member
          </button>
        }
      />
      <DialogContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="invite-email" className="text-sm font-medium text-slate-400">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#141517] border-white/10 text-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-400">Role</label>
            <Select value={role} onValueChange={(v) => v && setRole(v as WorkspaceRole)}>
              <SelectTrigger className="w-full bg-[#141517] border-white/10 text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MembersTab({ workspaceSlug, currentUserId }: { workspaceSlug: string; currentUserId?: string }) {
  const dispatch = useAppDispatch()
  const members = useAppSelector((state) => state.workspaceMembers.items)
  const isLoading = useAppSelector((state) => state.workspaceMembers.isLoading)

  useEffect(() => {
    void dispatch(fetchWorkspaceMembers(workspaceSlug))
  }, [workspaceSlug, dispatch])

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">Manage Team</h2>
          <p className="text-sm text-slate-400">There are currently {members.length} members in your workspace.</p>
        </div>
        <InviteMemberDialog workspaceSlug={workspaceSlug} />
      </div>

      <div className="rounded-xl border border-white/10 bg-[#1a1a1c] shadow-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-[#1e1e20] text-[11px] font-bold tracking-widest uppercase text-slate-500">
          <div className="col-span-4 pl-4">NAME</div>
          <div className="col-span-4">EMAIL</div>
          <div className="col-span-2">ROLE</div>
          <div className="col-span-2">ACTIONS</div>
        </div>

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

              return (
                <div key={member.user_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-4 flex items-center gap-4 pl-4">
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${avatarColor(member.user_id)}`}>
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{displayName}</span>
                  </div>

                  <div className="col-span-4 flex items-center">
                    <span className="text-sm text-slate-400 truncate pr-4">{member.user.email}</span>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <Select
                      value={member.role}
                      onValueChange={(v) => {
                        if (v) void dispatch(changeWorkspaceMemberRole({ workspaceSlug, userId: member.user_id, role: v as WorkspaceRole }))
                      }}
                      disabled={member.user_id === currentUserId}
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

                  <div className="col-span-2 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-white/5 transition-colors">
                            <MoreVertical className="size-4" />
                          </button>
                        }
                      />
                      <DropdownMenuContent className="bg-[#1a1a1c] border-white/10 text-slate-200">
                        <DropdownMenuItem
                          disabled={member.user_id === currentUserId}
                          variant="destructive"
                          onClick={() => {
                            void dispatch(removeWorkspaceMember({ workspaceSlug, userId: member.user_id })).then(() => {
                              toast.success(`${displayName} removed from workspace`)
                            })
                          }}
                        >
                          Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function GeneralTab({ workspaceSlug }: { workspaceSlug: string }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const workspace = useAppSelector((state) => state.workspace.current)
  const [name, setName] = useState(workspace?.name ?? '')
  const [slug, setSlug] = useState(workspace?.slug ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (workspace) {
      setName(workspace.name)
      setSlug(workspace.slug)
    }
  }, [workspace])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updated = await dispatch(updateWorkspace({ slug: workspaceSlug, payload: { name, slug } })).unwrap()
      toast.success('Workspace updated')
      if (updated.slug !== workspaceSlug) navigate(`/w/${updated.slug}/settings`, { replace: true })
    } catch {
      toast.error('Failed to update workspace')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete workspace "${workspace?.name}"? This cannot be undone.`)) return
    setIsDeleting(true)
    try {
      await dispatch(deleteWorkspace(workspaceSlug)).unwrap()
      toast.success('Workspace deleted')
      navigate('/app', { replace: true })
    } catch {
      toast.error('Failed to delete workspace')
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="ws-name" className="text-sm font-medium text-slate-400">
            Workspace name
          </label>
          <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#141517] border-white/10 text-slate-200" required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="ws-slug" className="text-sm font-medium text-slate-400">
            Slug
          </label>
          <Input
            id="ws-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            className="bg-[#141517] border-white/10 text-slate-200"
            required
          />
        </div>
        <Button type="submit" disabled={isSaving} className="bg-indigo-500 hover:bg-indigo-600 text-white">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-3">
        <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
        <p className="text-sm text-slate-400">Deleting a workspace permanently removes all its projects, issues, and data.</p>
        <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete Workspace'}
        </Button>
      </div>
    </div>
  )
}

export default function WorkspaceSettingsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const user = useAppSelector((state) => state.auth.user)
  const [activeTab, setActiveTab] = useState('members')

  if (!workspaceSlug) return null

  return (
    <div className="flex h-full bg-background flex-col overflow-y-auto w-full">
      <div className="p-8 lg:p-12 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-100 mb-3">Workspace Settings</h1>
          <p className="text-sm text-slate-400">Manage your team and workspace configurations.</p>
        </div>

        <div className="flex gap-8 border-b border-white/10 mb-8 px-2">
          {['General', 'Members', 'Billing', 'Integrations'].map((tab) => {
            const lowerTab = tab.toLowerCase()
            return (
              <button
                key={lowerTab}
                onClick={() => setActiveTab(lowerTab)}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === lowerTab ? 'text-slate-200' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
                {activeTab === lowerTab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500 rounded-t-full" />}
              </button>
            )
          })}
        </div>

        {activeTab === 'general' && <GeneralTab workspaceSlug={workspaceSlug} />}
        {activeTab === 'members' && <MembersTab workspaceSlug={workspaceSlug} currentUserId={user?.id} />}
        {(activeTab === 'billing' || activeTab === 'integrations') && (
          <div className="py-20 text-center">
            <p className="text-slate-500 text-sm">The {activeTab} section is under development.</p>
          </div>
        )}
      </div>
    </div>
  )
}
