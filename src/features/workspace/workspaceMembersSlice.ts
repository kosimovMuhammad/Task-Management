import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { WorkspaceMember, WorkspaceRole } from '@/types/workspace'

interface WorkspaceMembersState {
  items: WorkspaceMember[]
  isLoading: boolean
  error: string | null
}

const initialState: WorkspaceMembersState = {
  items: [],
  isLoading: false,
  error: null,
}

export const fetchWorkspaceMembers = createAsyncThunk(
  'workspaceMembers/fetch',
  async (workspaceSlug: string) => {
    const { data } = await apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceSlug}/members`)
    return data
  },
)

export const inviteWorkspaceMember = createAsyncThunk(
  'workspaceMembers/invite',
  async ({ workspaceSlug, email, role }: { workspaceSlug: string; email: string; role?: WorkspaceRole }) => {
    const { data } = await apiClient.post(`/workspaces/${workspaceSlug}/members/invite`, { email, role })
    return data
  },
)

export const changeWorkspaceMemberRole = createAsyncThunk(
  'workspaceMembers/changeRole',
  async ({ workspaceSlug, userId, role }: { workspaceSlug: string; userId: string; role: WorkspaceRole }) => {
    const { data } = await apiClient.patch<WorkspaceMember>(`/workspaces/${workspaceSlug}/members/${userId}`, {
      role,
    })
    return data
  },
)

export const removeWorkspaceMember = createAsyncThunk(
  'workspaceMembers/remove',
  async ({ workspaceSlug, userId }: { workspaceSlug: string; userId: string }) => {
    await apiClient.delete(`/workspaces/${workspaceSlug}/members/${userId}`)
    return userId
  },
)

const workspaceMembersSlice = createSlice({
  name: 'workspaceMembers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceMembers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchWorkspaceMembers.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchWorkspaceMembers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load members'
      })
      .addCase(removeWorkspaceMember.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.user_id !== action.payload)
      })
      .addCase(changeWorkspaceMemberRole.fulfilled, (state, action) => {
        const idx = state.items.findIndex((m) => m.user_id === action.payload.user_id)
        if (idx >= 0) state.items[idx] = action.payload
      })
  },
})

export default workspaceMembersSlice.reducer
