import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type Theme = 'light' | 'dark'
export type Locale = 'en' | 'ru' | 'tj'

export interface CreateIssueDefaults {
  projectId?: string
  stateId?: string
}

interface UiState {
  theme: Theme
  locale: Locale
  isSearchOpen: boolean
  isCreateIssueOpen: boolean
  createIssueDefaults: CreateIssueDefaults | null
  lastProjectId: string | null
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
  isSearchOpen: false,
  isCreateIssueOpen: false,
  createIssueDefaults: null,
  lastProjectId: null,
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
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchOpen = action.payload
    },
    toggleSearch: (state) => {
      state.isSearchOpen = !state.isSearchOpen
    },
    setCreateIssueOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateIssueOpen = action.payload
      if (!action.payload) state.createIssueDefaults = null
    },
    openCreateIssue: (state, action: PayloadAction<CreateIssueDefaults | undefined>) => {
      state.isCreateIssueOpen = true
      state.createIssueDefaults = action.payload ?? null
    },
    setLastProjectId: (state, action: PayloadAction<string>) => {
      state.lastProjectId = action.payload
    },
  },
})

export const {
  setTheme,
  toggleTheme,
  setLocale,
  setSearchOpen,
  toggleSearch,
  setCreateIssueOpen,
  openCreateIssue,
  setLastProjectId,
} = uiSlice.actions
export default uiSlice.reducer
