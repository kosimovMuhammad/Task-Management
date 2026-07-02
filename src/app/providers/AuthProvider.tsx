import { useEffect, type ReactNode } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { fetchMe } from '@/features/auth/authSlice'
import { getStoredTokens } from '@/lib/apiClient'

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const { access_token } = getStoredTokens()
    if (access_token) {
      void dispatch(fetchMe())
    }
  }, [dispatch])

  return children
}
