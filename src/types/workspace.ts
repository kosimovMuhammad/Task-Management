export interface Workspace {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
  updated_at: string
  user: {
    id: string
    email: string
    display_name: string
    avatar_url?: string | null
  }
}
