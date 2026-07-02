export interface Project {
  id: string
  workspace_id: string
  name: string
  identifier: string
  description: string | null
  lead_id: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type ProjectRole = 'admin' | 'member' | 'viewer'

export interface ProjectMember {
  project_id: string
  user_id: string
  role: ProjectRole
  created_at: string
  user: {
    id: string
    email: string
    display_name: string
    avatar_url?: string | null
  }
}
