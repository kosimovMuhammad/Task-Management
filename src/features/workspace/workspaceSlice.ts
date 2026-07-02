import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { Workspace } from '@/types/workspace'

interface WorkspaceState {
  items: Workspace[]
  current: Workspace | null
  isLoading: boolean
  error: string | null
}

const initialState: WorkspaceState = {
  items: [],
  current: null,
  isLoading: false,
  error: null,
}

export const fetchWorkspaces = createAsyncThunk('workspace/fetchWorkspaces', async () => {
  const { data } = await apiClient.get<Workspace[]>('/workspaces/')
  return data
})

export const createWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (payload: { name: string; slug: string }) => {
    const { data } = await apiClient.post<Workspace>('/workspaces/', payload)
    return data
  },
)

export const fetchWorkspace = createAsyncThunk('workspace/fetchWorkspace', async (slug: string) => {
  const { data } = await apiClient.get<Workspace>(`/workspaces/${slug}`)
  return data
})

export const updateWorkspace = createAsyncThunk(
  'workspace/updateWorkspace',
  async ({ slug, payload }: { slug: string; payload: Partial<Pick<Workspace, 'name' | 'slug'>> }) => {
    const { data } = await apiClient.patch<Workspace>(`/workspaces/${slug}`, payload)
    return data
  },
)

export const deleteWorkspace = createAsyncThunk('workspace/deleteWorkspace', async (slug: string) => {
  await apiClient.delete(`/workspaces/${slug}`)
  return slug
})

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action: { payload: Workspace }) => {
      state.current = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load workspaces'
      })
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.items = state.items.filter((w) => w.slug !== action.payload)
      })
      .addMatcher(
        (action) => [createWorkspace.fulfilled.type, fetchWorkspace.fulfilled.type, updateWorkspace.fulfilled.type].includes(action.type),
        (state, action: { payload: Workspace }) => {
          state.current = action.payload
          const idx = state.items.findIndex((w) => w.id === action.payload.id)
          if (idx >= 0) state.items[idx] = action.payload
          else state.items.push(action.payload)
        },
      )
  },
})

export const { setCurrentWorkspace } = workspaceSlice.actions
export default workspaceSlice.reducer
