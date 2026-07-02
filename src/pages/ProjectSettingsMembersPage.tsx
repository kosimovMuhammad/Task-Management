import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspaceMembers } from '@/features/workspace/workspaceMembersSlice'
import { addProjectMember, fetchProjectMembers, removeProjectMember } from '@/features/project/projectMembersSlice'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function ProjectSettingsMembersPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>()
  const members = useAppSelector((state) => state.projectMembers.items)
  const isLoading = useAppSelector((state) => state.projectMembers.isLoading)
  const workspaceMembers = useAppSelector((state) => state.workspaceMembers.items)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (!workspaceSlug || !projectId) return
    void dispatch(fetchProjectMembers({ workspaceSlug, projectId }))
    void dispatch(fetchWorkspaceMembers(workspaceSlug))
  }, [workspaceSlug, projectId, dispatch])

  if (!workspaceSlug || !projectId) return null

  const availableToAdd = workspaceMembers.filter((wm) => !members.some((m) => m.user_id === wm.user_id))

  const handleAdd = async () => {
    if (!selectedUserId) return
    setIsAdding(true)
    try {
      await dispatch(addProjectMember({ workspaceSlug, projectId, userId: selectedUserId })).unwrap()
      setSelectedUserId('')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('projectSettings.members')}</h2>
          <p className="text-sm text-muted-foreground">{t('projectSettings.membersSubtitle')}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={selectedUserId} onValueChange={(v) => v && setSelectedUserId(v)}>
          <SelectTrigger className="w-64">
            <SelectValue>
              {(v: string) => workspaceMembers.find((m) => m.user_id === v)?.user.display_name ?? t('projectSettings.pickMember')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableToAdd.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.user.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => void handleAdd()} disabled={!selectedUserId || isAdding}>
          <UserPlus className="size-4" />
          {t('projectSettings.addMember')}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-lg" />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {members.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {initials(member.user.display_name)}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.user.display_name}</p>
                  <p className="text-xs text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs capitalize text-muted-foreground">{member.role}</span>
                <button
                  onClick={() => void dispatch(removeProjectMember({ workspaceSlug, projectId, userId: member.user_id }))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('common.noResults')}</p>
          )}
        </div>
      )}
    </div>
  )
}
