import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { Project } from '@/types/project'

interface ProjectState {
  items: Project[]
  current: Project | null
  isLoading: boolean
  error: string | null
}

const initialState: ProjectState = {
  items: [],
  current: null,
  isLoading: false,
  error: null,
}

export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (workspaceSlug: string) => {
    const { data } = await apiClient.get<Project[]>(`/workspaces/${workspaceSlug}/projects/`)
    return data
  },
)

export const createProject = createAsyncThunk(
  'project/createProject',
  async ({
    workspaceSlug,
    payload,
  }: {
    workspaceSlug: string
    payload: { name: string; identifier: string; description?: string; lead_id?: string }
  }) => {
    const { data } = await apiClient.post<Project>(`/workspaces/${workspaceSlug}/projects/`, payload)
    return data
  },
)

export const fetchProject = createAsyncThunk(
  'project/fetchProject',
  async ({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) => {
    const { data } = await apiClient.get<Project>(`/workspaces/${workspaceSlug}/projects/${projectId}`)
    return data
  },
)

export const updateProject = createAsyncThunk(
  'project/updateProject',
  async ({
    workspaceSlug,
    projectId,
    payload,
  }: {
    workspaceSlug: string
    projectId: string
    payload: Partial<Pick<Project, 'name' | 'description' | 'lead_id' | 'is_archived'>>
  }) => {
    const { data } = await apiClient.patch<Project>(
      `/workspaces/${workspaceSlug}/projects/${projectId}`,
      payload,
    )
    return data
  },
)

export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async ({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) => {
    await apiClient.delete(`/workspaces/${workspaceSlug}/projects/${projectId}`)
    return projectId
  },
)

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load projects'
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
      })
      .addMatcher(
        (action) => [createProject.fulfilled.type, fetchProject.fulfilled.type, updateProject.fulfilled.type].includes(action.type),
        (state, action: { payload: Project }) => {
          state.current = action.payload
          const idx = state.items.findIndex((p) => p.id === action.payload.id)
          if (idx >= 0) state.items[idx] = action.payload
          else state.items.push(action.payload)
        },
      )
  },
})

export default projectSlice.reducer
