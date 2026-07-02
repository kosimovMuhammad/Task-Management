import { useEffect, type ReactNode } from 'react'
import { useAppSelector } from '@/hooks/useAppSelector'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppSelector((state) => state.ui.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return children
}
