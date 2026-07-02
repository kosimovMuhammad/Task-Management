export type StateGroup = 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled'

export interface IssueState {
  id: string
  project_id: string
  name: string
  color: string
  group: StateGroup
  order: number
  is_default: boolean
  created_at: string
  updated_at: string
}
