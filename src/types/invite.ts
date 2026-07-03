export interface InvitePreview {
  id: string
  workspace_id: string
  email: string
  role: 'admin' | 'member' | 'guest'
  expires_at: string
  workspace: {
    id: string
    name: string
    slug: string
  }
  invited_by: {
    id: string
    display_name: string
    email: string
  }
}

export interface AcceptedInvite {
  workspace_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'guest'
}
