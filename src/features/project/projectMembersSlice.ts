import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { ProjectMember, ProjectRole } from '@/types/project'

interface ProjectMembersState {
  items: ProjectMember[]
  isLoading: boolean
  error: string | null
}

const initialState: ProjectMembersState = {
  items: [],
  isLoading: false,
  error: null,
}

interface ProjectScope {
  workspaceSlug: string
  projectId: string
}

function membersUrl({ workspaceSlug, projectId }: ProjectScope) {
  return `/workspaces/${workspaceSlug}/projects/${projectId}/members`
}

export const fetchProjectMembers = createAsyncThunk(
  'projectMembers/fetch',
  async (scope: ProjectScope) => {
    const { data } = await apiClient.get<ProjectMember[]>(membersUrl(scope))
    return data
  },
)

export const addProjectMember = createAsyncThunk(
  'projectMembers/add',
  async ({ userId, role, ...scope }: ProjectScope & { userId: string; role?: ProjectRole }) => {
    const { data } = await apiClient.post<ProjectMember>(membersUrl(scope), { user_id: userId, role })
    return data
  },
)

export const removeProjectMember = createAsyncThunk(
  'projectMembers/remove',
  async ({ userId, ...scope }: ProjectScope & { userId: string }) => {
    await apiClient.delete(`${membersUrl(scope)}/${userId}`)
    return userId
  },
)

const projectMembersSlice = createSlice({
  name: 'projectMembers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectMembers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProjectMembers.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchProjectMembers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load members'
      })
      .addCase(addProjectMember.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(removeProjectMember.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.user_id !== action.payload)
      })
  },
})

export default projectMembersSlice.reducer
