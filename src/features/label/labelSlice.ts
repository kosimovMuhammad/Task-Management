import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { Label } from '@/types/label'

interface LabelState {
  items: Label[]
  isLoading: boolean
  error: string | null
}

const initialState: LabelState = {
  items: [],
  isLoading: false,
  error: null,
}

interface ProjectScope {
  workspaceSlug: string
  projectId: string
}

export const fetchLabels = createAsyncThunk(
  'label/fetchLabels',
  async ({ workspaceSlug, projectId }: ProjectScope) => {
    const { data } = await apiClient.get<Label[]>(
      `/workspaces/${workspaceSlug}/projects/${projectId}/labels/`,
    )
    return data
  },
)

export const createLabel = createAsyncThunk(
  'label/createLabel',
  async ({ workspaceSlug, projectId, payload }: ProjectScope & { payload: { name: string; color: string } }) => {
    const { data } = await apiClient.post<Label>(
      `/workspaces/${workspaceSlug}/projects/${projectId}/labels/`,
      payload,
    )
    return data
  },
)

export const updateLabel = createAsyncThunk(
  'label/updateLabel',
  async ({
    workspaceSlug,
    projectId,
    labelId,
    payload,
  }: ProjectScope & { labelId: string; payload: Partial<{ name: string; color: string }> }) => {
    const { data } = await apiClient.patch<Label>(
      `/workspaces/${workspaceSlug}/projects/${projectId}/labels/${labelId}`,
      payload,
    )
    return data
  },
)

export const deleteLabel = createAsyncThunk(
  'label/deleteLabel',
  async ({ workspaceSlug, projectId, labelId }: ProjectScope & { labelId: string }) => {
    await apiClient.delete(`/workspaces/${workspaceSlug}/projects/${projectId}/labels/${labelId}`)
    return labelId
  },
)

const labelSlice = createSlice({
  name: 'label',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLabels.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLabels.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchLabels.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load labels'
      })
      .addCase(deleteLabel.fulfilled, (state, action) => {
        state.items = state.items.filter((l) => l.id !== action.payload)
      })
      .addMatcher(
        (action) => [createLabel.fulfilled.type, updateLabel.fulfilled.type].includes(action.type),
        (state, action: { payload: Label }) => {
          const idx = state.items.findIndex((l) => l.id === action.payload.id)
          if (idx >= 0) state.items[idx] = action.payload
          else state.items.push(action.payload)
        },
      )
  },
})

export default labelSlice.reducer
