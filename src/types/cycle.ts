export type CycleStatus = 'draft' | 'upcoming' | 'active' | 'completed'

export interface Cycle {
  id: string
  workspace_id: string
  project_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: CycleStatus
  created_at: string
  updated_at: string
  progress?: number
}
