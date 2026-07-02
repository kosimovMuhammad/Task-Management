import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthTokens } from '@/types/auth'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function getStoredTokens(): Partial<AuthTokens> {
  return {
    access_token: localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined,
    refresh_token: localStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined,
  }
}

export function storeTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { access_token } = getStoredTokens()
  if (access_token) {
    config.headers.set('Authorization', `Bearer ${access_token}`)
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { refresh_token } = getStoredTokens()
  if (!refresh_token) {
    throw new Error('No refresh token available')
  }
  const { data } = await axios.post<AuthTokens>(
    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
    { refresh_token },
  )
  storeTokens(data)
  return data.access_token
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newAccessToken = await refreshPromise
      originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
      return apiClient(originalRequest)
    } catch (refreshError) {
      clearTokens()
      return Promise.reject(refreshError)
    }
  },
)
