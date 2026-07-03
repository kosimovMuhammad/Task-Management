import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { InvitePreview } from '@/types/invite'

interface InviteState {
  current: InvitePreview | null
  isLoading: boolean
  error: string | null
}

const initialState: InviteState = {
  current: null,
  isLoading: false,
  error: null,
}

export const fetchInviteByToken = createAsyncThunk('invite/fetchByToken', async (token: string) => {
  const { data } = await apiClient.get<InvitePreview>(`/invites/${token}`)
  return data
})

export const acceptInvite = createAsyncThunk('invite/accept', async (token: string) => {
  const { data } = await apiClient.post(`/invites/${token}/accept`)
  return data
})

const inviteSlice = createSlice({
  name: 'invite',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInviteByToken.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchInviteByToken.fulfilled, (state, action) => {
        state.current = action.payload
        state.isLoading = false
      })
      .addCase(fetchInviteByToken.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Invite not found or expired'
      })
  },
})

export default inviteSlice.reducer
