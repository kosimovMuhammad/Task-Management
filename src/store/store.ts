import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/authSlice'
import uiReducer from '@/features/ui/uiSlice'
import workspaceReducer from '@/features/workspace/workspaceSlice'
import projectReducer from '@/features/project/projectSlice'
import projectMembersReducer from '@/features/project/projectMembersSlice'
import stateReducer from '@/features/state/stateSlice'
import labelReducer from '@/features/label/labelSlice'
import issueReducer from '@/features/issue/issueSlice'
import cycleReducer from '@/features/cycle/cycleSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    workspace: workspaceReducer,
    project: projectReducer,
    projectMembers: projectMembersReducer,
    state: stateReducer,
    label: labelReducer,
    issue: issueReducer,
    cycle: cycleReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
