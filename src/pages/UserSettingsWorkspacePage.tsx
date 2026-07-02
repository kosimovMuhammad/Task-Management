import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Building2, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspaces } from '@/features/workspace/workspaceSlice'

export default function UserSettingsWorkspacePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const workspaces = useAppSelector((state) => state.workspace.items)
  const isLoading = useAppSelector((state) => state.workspace.isLoading)

  useEffect(() => {
    void dispatch(fetchWorkspaces())
  }, [dispatch])

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('userSettings.yourWorkspaces')}</h2>
        <p className="text-sm text-muted-foreground">{t('userSettings.workspacesSubtitle')}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-lg" />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {workspaces.map((ws) => (
            <Link key={ws.id} to={`/w/${ws.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-card">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{ws.name}</p>
                <p className="text-xs text-muted-foreground">{ws.slug}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        to="/workspaces/new"
        className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
      >
        <Plus className="size-4" />
        {t('userSettings.createWorkspace')}
      </Link>
    </div>
  )
}
