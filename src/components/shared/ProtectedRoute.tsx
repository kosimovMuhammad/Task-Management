import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppSelector'
import { Loader } from '@/components/shared/Loader'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
  const location = useLocation()

  if (isLoading) {
    return <Loader />
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  return <Outlet />
}
