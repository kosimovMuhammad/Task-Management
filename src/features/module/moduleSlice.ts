import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { ModuleStatus, ProjectModule } from '@/types/module'

interface ModuleState {
  items: ProjectModule[]
  current: ProjectModule | null
  isLoading: boolean
  error: string | null
}

const initialState: ModuleState = {
  items: [],
  current: null,
  isLoading: false,
  error: null,
}

interface ProjectScope {
  workspaceSlug: string
  projectId: string
}

function modulesUrl({ workspaceSlug, projectId }: ProjectScope) {
  return `/workspaces/${workspaceSlug}/projects/${projectId}/modules/`
}

export const fetchModules = createAsyncThunk('module/fetchModules', async (scope: ProjectScope) => {
  const { data } = await apiClient.get<ProjectModule[]>(modulesUrl(scope))
  return data
})

export const createModule = createAsyncThunk(
  'module/createModule',
  async ({
    payload,
    ...scope
  }: ProjectScope & {
    payload: { name: string; description?: string; status?: ModuleStatus; start_date?: string; target_date?: string }
  }) => {
    const { data } = await apiClient.post<ProjectModule>(modulesUrl(scope), payload)
    return data
  },
)

export const fetchModule = createAsyncThunk(
  'module/fetchModule',
  async ({ moduleId, ...scope }: ProjectScope & { moduleId: string }) => {
    const { data } = await apiClient.get<ProjectModule>(`${modulesUrl(scope)}${moduleId}`)
    return data
  },
)

export const updateModule = createAsyncThunk(
  'module/updateModule',
  async ({
    moduleId,
    payload,
    ...scope
  }: ProjectScope & {
    moduleId: string
    payload: Partial<{ name: string; description: string; status: ModuleStatus; start_date: string; target_date: string }>
  }) => {
    const { data } = await apiClient.patch<ProjectModule>(`${modulesUrl(scope)}${moduleId}`, payload)
    return data
  },
)

export const deleteModule = createAsyncThunk(
  'module/deleteModule',
  async ({ moduleId, ...scope }: ProjectScope & { moduleId: string }) => {
    await apiClient.delete(`${modulesUrl(scope)}${moduleId}`)
    return moduleId
  },
)

export const addIssuesToModule = createAsyncThunk(
  'module/addIssuesToModule',
  async ({ moduleId, issueIds, ...scope }: ProjectScope & { moduleId: string; issueIds: string[] }) => {
    await apiClient.post(`${modulesUrl(scope)}${moduleId}/issues`, { issue_ids: issueIds })
    return { moduleId }
  },
)

export const removeIssueFromModule = createAsyncThunk(
  'module/removeIssueFromModule',
  async ({ moduleId, issueId, ...scope }: ProjectScope & { moduleId: string; issueId: string }) => {
    await apiClient.delete(`${modulesUrl(scope)}${moduleId}/issues/${issueId}`)
    return { moduleId, issueId }
  },
)

const moduleSlice = createSlice({
  name: 'module',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModules.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load modules'
      })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload)
      })
      .addMatcher(
        (action) => [createModule.fulfilled.type, fetchModule.fulfilled.type, updateModule.fulfilled.type].includes(action.type),
        (state, action: { payload: ProjectModule }) => {
          state.current = action.payload
          const idx = state.items.findIndex((m) => m.id === action.payload.id)
          if (idx >= 0) state.items[idx] = action.payload
          else state.items.push(action.payload)
        },
      )
  },
})

export default moduleSlice.reducer
