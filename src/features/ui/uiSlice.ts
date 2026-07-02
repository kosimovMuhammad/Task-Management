import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type Theme = 'light' | 'dark'
export type Locale = 'en' | 'ru' | 'tj'

interface UiState {
  theme: Theme
  locale: Locale
}

const THEME_KEY = 'theme'
const LOCALE_KEY = 'locale'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_KEY)
  if (stored === 'en' || stored === 'ru' || stored === 'tj') return stored
  return (import.meta.env.VITE_DEFAULT_LOCALE as Locale) || 'ru'
}

const initialState: UiState = {
  theme: getInitialTheme(),
  locale: getInitialLocale(),
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
      localStorage.setItem(THEME_KEY, action.payload)
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(THEME_KEY, state.theme)
    },
    setLocale: (state, action: PayloadAction<Locale>) => {
      state.locale = action.payload
      localStorage.setItem(LOCALE_KEY, action.payload)
    },
  },
})

export const { setTheme, toggleTheme, setLocale } = uiSlice.actions
export default uiSlice.reducer
