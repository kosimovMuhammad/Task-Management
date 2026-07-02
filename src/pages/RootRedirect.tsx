import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { fetchWorkspaces } from '@/features/workspace/workspaceSlice'
import { Loader } from '@/components/shared/Loader'

export default function RootRedirect() {
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.workspace.items)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    void dispatch(fetchWorkspaces()).finally(() => setSettled(true))
  }, [dispatch])

  if (!settled) {
    return <Loader />
  }

  if (items.length > 0) {
    return <Navigate to={`/w/${items[0].slug}`} replace />
  }

  return <Navigate to="/workspaces/new" replace />
}
