import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setTheme as setThemeAction, toggleTheme as toggleThemeAction, type Theme } from '@/features/ui/uiSlice'

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void } {
  const theme = useAppSelector((state) => state.ui.theme)
  const dispatch = useAppDispatch()

  return {
    theme,
    setTheme: (next: Theme) => dispatch(setThemeAction(next)),
    toggleTheme: () => dispatch(toggleThemeAction()),
  }
}
