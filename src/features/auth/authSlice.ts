import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient, clearTokens, getStoredTokens, storeTokens } from '@/lib/apiClient'
import type { AuthTokens, LoginPayload, RegisterPayload, User } from '@/types/auth'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// If a token is already stored, treat the session as loading until AuthProvider's
// fetchMe resolves — avoids ProtectedRoute redirecting to /login before we've validated it.
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: Boolean(getStoredTokens().access_token),
  error: null,
}

import { isAxiosError } from 'axios'

export const login = createAsyncThunk('auth/login', async (payload: LoginPayload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<AuthTokens>('/auth/login', payload)
    storeTokens(data)
    return data.user
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.message) {
      return rejectWithValue(err.response.data.error.message)
    }
    return rejectWithValue('Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (payload: RegisterPayload, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.post<AuthTokens>('/auth/register', payload)
    storeTokens(data)
    return data.user
  } catch (err) {
    if (isAxiosError(err) && err.response?.data?.error?.message) {
      const details = err.response.data.error.details?.fieldErrors
      if (details) {
        const firstError = Object.values(details)[0]
        if (Array.isArray(firstError) && firstError.length > 0) {
           return rejectWithValue(`${err.response.data.error.message}: ${firstError[0]}`)
        }
      }
      return rejectWithValue(err.response.data.error.message)
    }
    return rejectWithValue('Registration failed')
  }
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const { data } = await apiClient.get<User>('/auth/me')
  return data
})

export const updateMe = createAsyncThunk(
  'auth/updateMe',
  async (payload: Partial<Pick<User, 'display_name' | 'avatar_url'>>) => {
    const { data } = await apiClient.patch<User>('/auth/me', payload)
    return data
  },
)

export const refreshToken = createAsyncThunk('auth/refreshToken', async () => {
  const { refresh_token } = getStoredTokens()
  const { data } = await apiClient.post<AuthTokens>('/auth/refresh', { refresh_token })
  storeTokens(data)
  return data
})

export const logout = createAsyncThunk('auth/logout', async () => {
  clearTokens()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
        state.error = null
      })
      .addMatcher(
        (action) => [login.fulfilled.type, register.fulfilled.type, fetchMe.fulfilled.type, updateMe.fulfilled.type].includes(action.type),
        (state, action: { payload: User }) => {
          state.user = action.payload
          state.isAuthenticated = true
          state.isLoading = false
        },
      )
      .addMatcher(
        (action) => [login.rejected.type, register.rejected.type, fetchMe.rejected.type].includes(action.type),
        (state, action: any) => {
          state.isLoading = false
          state.isAuthenticated = false
          state.user = null
          state.error = action.payload ?? action.error?.message ?? 'Authentication failed'
        },
      )
  },
})

export default authSlice.reducer
