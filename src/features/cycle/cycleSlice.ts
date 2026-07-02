import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { Cycle } from '@/types/cycle'

interface CycleState {
  items: Cycle[]
  current: Cycle | null
  isLoading: boolean
  error: string | null
}

const initialState: CycleState = {
  items: [],
  current: null,
  isLoading: false,
  error: null,
}

interface ProjectScope {
  workspaceSlug: string
  projectId: string
}

function cyclesUrl({ workspaceSlug, projectId }: ProjectScope) {
  return `/workspaces/${workspaceSlug}/projects/${projectId}/cycles/`
}

export const fetchCycles = createAsyncThunk('cycle/fetchCycles', async (scope: ProjectScope) => {
  const { data } = await apiClient.get<Cycle[]>(cyclesUrl(scope))
  return data
})

export const createCycle = createAsyncThunk(
  'cycle/createCycle',
  async ({
    payload,
    ...scope
  }: ProjectScope & { payload: { name: string; description?: string; start_date?: string; end_date?: string } }) => {
    const { data } = await apiClient.post<Cycle>(cyclesUrl(scope), payload)
    return data
  },
)

export const fetchCycle = createAsyncThunk(
  'cycle/fetchCycle',
  async ({ cycleId, ...scope }: ProjectScope & { cycleId: string }) => {
    const { data } = await apiClient.get<Cycle>(`${cyclesUrl(scope)}${cycleId}`)
    return data
  },
)

export const updateCycle = createAsyncThunk(
  'cycle/updateCycle',
  async ({
    cycleId,
    payload,
    ...scope
  }: ProjectScope & { cycleId: string; payload: Partial<{ name: string; description: string; start_date: string; end_date: string }> }) => {
    const { data } = await apiClient.patch<Cycle>(`${cyclesUrl(scope)}${cycleId}`, payload)
    return data
  },
)

export const deleteCycle = createAsyncThunk(
  'cycle/deleteCycle',
  async ({ cycleId, ...scope }: ProjectScope & { cycleId: string }) => {
    await apiClient.delete(`${cyclesUrl(scope)}${cycleId}`)
    return cycleId
  },
)

export const addIssuesToCycle = createAsyncThunk(
  'cycle/addIssuesToCycle',
  async ({ cycleId, issueIds, ...scope }: ProjectScope & { cycleId: string; issueIds: string[] }) => {
    await apiClient.post(`${cyclesUrl(scope)}${cycleId}/issues`, { issue_ids: issueIds })
    return { cycleId }
  },
)

export const removeIssueFromCycle = createAsyncThunk(
  'cycle/removeIssueFromCycle',
  async ({ cycleId, issueId, ...scope }: ProjectScope & { cycleId: string; issueId: string }) => {
    await apiClient.delete(`${cyclesUrl(scope)}${cycleId}/issues/${issueId}`)
    return { cycleId, issueId }
  },
)

const cycleSlice = createSlice({
  name: 'cycle',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCycles.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCycles.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchCycles.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load cycles'
      })
      .addCase(deleteCycle.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c.id !== action.payload)
      })
      .addMatcher(
        (action) => [createCycle.fulfilled.type, fetchCycle.fulfilled.type, updateCycle.fulfilled.type].includes(action.type),
        (state, action: { payload: Cycle }) => {
          state.current = action.payload
          const idx = state.items.findIndex((c) => c.id === action.payload.id)
          if (idx >= 0) state.items[idx] = action.payload
          else state.items.push(action.payload)
        },
      )
  },
})

export default cycleSlice.reducer
