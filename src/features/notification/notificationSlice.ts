import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type { Notification, NotificationListResponse } from '@/types/notification'

interface NotificationState {
  items: Notification[]
  unreadCount: number
  nextCursor: string | null
  isLoading: boolean
  error: string | null
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  nextCursor: null,
  isLoading: false,
  error: null,
}

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({ workspaceSlug, read }: { workspaceSlug: string; read?: boolean }) => {
    const { data } = await apiClient.get<NotificationListResponse>(`/workspaces/${workspaceSlug}/notifications/`, {
      params: read === undefined ? undefined : { read: String(read) },
    })
    return data
  },
)

export const markAllNotificationsRead = createAsyncThunk(
  'notification/markAllRead',
  async (workspaceSlug: string) => {
    await apiClient.post(`/workspaces/${workspaceSlug}/notifications/read-all`)
  },
)

export const markNotificationRead = createAsyncThunk(
  'notification/markOneRead',
  async ({ workspaceSlug, notificationId }: { workspaceSlug: string; notificationId: string }) => {
    await apiClient.post(`/workspaces/${workspaceSlug}/notifications/${notificationId}/read`)
    return notificationId
  },
)

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.data
        state.unreadCount = action.payload.unread_count
        state.nextCursor = action.payload.next_cursor
        state.isLoading = false
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load notifications'
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, is_read: true }))
        state.unreadCount = 0
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload)
        if (item && !item.is_read) {
          item.is_read = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
  },
})

export default notificationSlice.reducer
