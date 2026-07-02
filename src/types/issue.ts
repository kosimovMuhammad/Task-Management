import type { Label } from '@/types/label'

export type IssuePriority = 'none' | 'low' | 'medium' | 'high' | 'urgent'

export interface IssueAssignee {
  id: string
  display_name: string
  email?: string
  avatar_url?: string | null
}

export interface Issue {
  id: string
  workspace_id: string
  project_id: string
  sequence_id: number
  title: string
  description: string | null
  state_id: string
  priority: IssuePriority
  parent_id: string | null
  estimate_points: number | null
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  created_by_id: string
  sort_order: number
  created_at: string
  updated_at: string
  assignees: IssueAssignee[]
  labels: Label[]
}

export interface IssueListResponse {
  data: Issue[]
  next_cursor: string | null
  group_by?: string | null
  groups?: Record<string, Issue[]> | null
}

export interface IssueFilters {
  state?: string | string[]
  priority?: string | string[]
  assignee?: string | string[]
  label?: string | string[]
  cycle?: string
  search?: string
  group_by?: 'state' | 'priority' | 'assignee'
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'due_date' | 'sort_order'
  order?: 'asc' | 'desc'
  cursor?: string
}

export interface CreateIssuePayload {
  title: string
  description?: string
  state_id: string
  priority?: IssuePriority
  parent_id?: string | null
  assignee_ids?: string[]
  label_ids?: string[]
  start_date?: string | null
  due_date?: string | null
  estimate_points?: number | null
}

export interface Comment {
  id: string
  issue_id: string
  author_id: string
  body: string
  parent_comment_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  author: IssueAssignee
}

export type ActivityEntry = Record<string, unknown> & { id: string; created_at: string }

export type RelationType = 'blocks' | 'blocked_by' | 'relates_to' | 'duplicates'

export interface IssueRelation {
  id: string
  issue_id: string
  related_issue_id: string
  relation_type: RelationType
  created_at: string
  related_issue?: Issue
}

export interface IssueRelations {
  blocks: IssueRelation[]
  blocked_by: IssueRelation[]
  relates_to: IssueRelation[]
  duplicates: IssueRelation[]
}

export interface Attachment {
  id: string
  workspace_id: string
  issue_id: string
  uploaded_by_id: string
  file_name: string
  file_size: number
  mime_type: string
  storage_key: string
  created_at: string
  uploaded_by: IssueAssignee
  download_url: string
}
