export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  first_name?: string
  last_name?: string
}
