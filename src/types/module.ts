export type ModuleStatus = 'backlog' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

export interface ProjectModule {
  id: string
  workspace_id: string
  project_id: string
  name: string
  description: string | null
  status: ModuleStatus
  lead_id: string | null
  start_date: string | null
  target_date: string | null
  created_at: string
  updated_at: string
}
