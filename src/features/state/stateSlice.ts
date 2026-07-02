import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { IssueState as IssueStateModel } from '@/types/state'

interface StateSliceState {
  items: IssueStateModel[]
  isLoading: boolean
  error: string | null
}

const initialState: StateSliceState = {
  items: [],
  isLoading: false,
  error: null,
}

interface ProjectScope {
  workspaceSlug: string
  projectId: string
}

export const fetchStates = createAsyncThunk(
  'state/fetchStates',
  async ({ workspaceSlug, projectId }: ProjectScope) => {
    const { data } = await apiClient.get<IssueStateModel[]>(
      `/workspaces/${workspaceSlug}/projects/${projectId}/states/`,
    )
    return data
  },
)

export const createState = createAsyncThunk(
  'state/createState',
  async ({
    workspaceSlug,
    projectId,
    payload,
  }: ProjectScope & { payload: Pick<IssueStateModel, 'name' | 'color' | 'group'> & Partial<Pick<IssueStateModel, 'order' | 'is_default'>> }) => {
    const { data } = await apiClient.post<IssueStateModel>(
      `/workspaces/${workspaceSlug}/projects/${projectId}/states/`,
      payload,
    )
    return data
  },
)

export const updateState = createAsyncThunk(
  'state/updateState',
  async ({
    workspaceSlug,
    projectId,
    stateId,
    payload,
  }: ProjectScope & { stateId: string; payload: Partial<Pick<IssueStateModel, 'name' | 'color' | 'group' | 'order' | 'is_default'>> }) => {
    const { data } = await apiClient.patch<IssueStateModel>(
      `/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}`,
      payload,
    )
    return data
  },
)

export const deleteState = createAsyncThunk(
  'state/deleteState',
  async ({ workspaceSlug, projectId, stateId }: ProjectScope & { stateId: string }) => {
    await apiClient.delete(`/workspaces/${workspaceSlug}/projects/${projectId}/states/${stateId}`)
    return stateId
  },
)

const stateSlice = createSlice({
  name: 'state',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStates.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchStates.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchStates.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load states'
      })
      .addCase(deleteState.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload)
      })
      .addMatcher(
        (action) => [createState.fulfilled.type, updateState.fulfilled.type].includes(action.type),
        (state, action: { payload: IssueStateModel }) => {
          const idx = state.items.findIndex((s) => s.id === action.payload.id)
          if (idx >= 0) state.items[idx] = action.payload
          else state.items.push(action.payload)
        },
      )
  },
})

export default stateSlice.reducer
