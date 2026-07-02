import { useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspace } from '@/features/workspace/workspaceSlice'
import { fetchProjects } from '@/features/project/projectSlice'
import { Loader } from '@/components/shared/Loader'
import { NotFound } from '@/components/shared/NotFound'

export function WorkspaceScope() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>()
  const dispatch = useAppDispatch()
  const current = useAppSelector((state) => state.workspace.current)
  const error = useAppSelector((state) => state.workspace.error)

  useEffect(() => {
    if (workspaceSlug && current?.slug !== workspaceSlug) {
      void dispatch(fetchWorkspace(workspaceSlug)).then((action) => {
        if (fetchWorkspace.fulfilled.match(action)) {
          void dispatch(fetchProjects(workspaceSlug))
        }
      })
    }
  }, [workspaceSlug, current?.slug, dispatch])

  if (current?.slug !== workspaceSlug) {
    if (error) return <NotFound />
    return <Loader />
  }

  return <Outlet />
}
