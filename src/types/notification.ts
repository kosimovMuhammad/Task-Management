export type NotificationType = 'issue_assigned' | 'comment_added' | 'mentioned'

export interface Notification {
  id: string
  workspace_id: string
  recipient_id: string
  actor_id: string
  type: NotificationType
  issue_id: string | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
  actor: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

export interface NotificationListResponse {
  data: Notification[]
  unread_count: number
  next_cursor: string | null
}
