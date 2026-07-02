import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/lib/apiClient'
import type {
  ActivityEntry,
  Attachment,
  Comment,
  CreateIssuePayload,
  Issue,
  IssueFilters,
  IssueListResponse,
  IssueRelations,
  RelationType,
} from '@/types/issue'

interface ProjectScope {
  workspaceSlug: string
  projectId: string
}

interface IssueScope extends ProjectScope {
  issueId: string
}

interface IssueSliceState {
  items: Issue[]
  groups: Record<string, Issue[]> | null
  nextCursor: string | null
  current: Issue | null
  comments: Comment[]
  activity: ActivityEntry[]
  relations: IssueRelations | null
  attachments: Attachment[]
  isLoading: boolean
  error: string | null
}

const initialState: IssueSliceState = {
  items: [],
  groups: null,
  nextCursor: null,
  current: null,
  comments: [],
  activity: [],
  relations: null,
  attachments: [],
  isLoading: false,
  error: null,
}

function issuesUrl({ workspaceSlug, projectId }: ProjectScope) {
  return `/workspaces/${workspaceSlug}/projects/${projectId}/issues/`
}

function issueUrl({ workspaceSlug, projectId, issueId }: IssueScope) {
  return `${issuesUrl({ workspaceSlug, projectId })}${issueId}`
}

export const fetchIssues = createAsyncThunk(
  'issue/fetchIssues',
  async ({ workspaceSlug, projectId, filters }: ProjectScope & { filters?: IssueFilters }) => {
    const { data } = await apiClient.get<IssueListResponse>(issuesUrl({ workspaceSlug, projectId }), {
      params: filters,
    })
    return data
  },
)

export const createIssue = createAsyncThunk(
  'issue/createIssue',
  async ({ workspaceSlug, projectId, payload }: ProjectScope & { payload: CreateIssuePayload }) => {
    const { data } = await apiClient.post<Issue>(issuesUrl({ workspaceSlug, projectId }), payload)
    return data
  },
)

export const fetchIssue = createAsyncThunk('issue/fetchIssue', async (scope: IssueScope) => {
  const { data } = await apiClient.get<Issue>(issueUrl(scope))
  return data
})

export const updateIssue = createAsyncThunk(
  'issue/updateIssue',
  async ({ payload, ...scope }: IssueScope & { payload: Partial<CreateIssuePayload> & { sort_order?: number } }) => {
    const { data } = await apiClient.patch<Issue>(issueUrl(scope), payload)
    return data
  },
)

export const deleteIssue = createAsyncThunk('issue/deleteIssue', async (scope: IssueScope) => {
  await apiClient.delete(issueUrl(scope))
  return scope.issueId
})

export const addAssignee = createAsyncThunk(
  'issue/addAssignee',
  async ({ userId, ...scope }: IssueScope & { userId: string }) => {
    const { data } = await apiClient.post<Issue>(`${issueUrl(scope)}/assignees`, { user_id: userId })
    return data
  },
)

export const removeAssignee = createAsyncThunk(
  'issue/removeAssignee',
  async ({ userId, ...scope }: IssueScope & { userId: string }) => {
    const { data } = await apiClient.delete<Issue>(`${issueUrl(scope)}/assignees/${userId}`)
    return data
  },
)

export const attachLabel = createAsyncThunk(
  'issue/attachLabel',
  async ({ labelId, ...scope }: IssueScope & { labelId: string }) => {
    const { data } = await apiClient.post<Issue>(`${issueUrl(scope)}/labels`, { label_id: labelId })
    return data
  },
)

export const detachLabel = createAsyncThunk(
  'issue/detachLabel',
  async ({ labelId, ...scope }: IssueScope & { labelId: string }) => {
    const { data } = await apiClient.delete<Issue>(`${issueUrl(scope)}/labels/${labelId}`)
    return data
  },
)

export const fetchComments = createAsyncThunk('issue/fetchComments', async (scope: IssueScope) => {
  const { data } = await apiClient.get<Comment[]>(`${issueUrl(scope)}/comments/`)
  return data
})

export const addComment = createAsyncThunk(
  'issue/addComment',
  async ({ body, parentCommentId, ...scope }: IssueScope & { body: string; parentCommentId?: string }) => {
    const { data } = await apiClient.post<Comment>(`${issueUrl(scope)}/comments/`, {
      body,
      parent_comment_id: parentCommentId,
    })
    return data
  },
)

export const editComment = createAsyncThunk(
  'issue/editComment',
  async ({ commentId, body, ...scope }: IssueScope & { commentId: string; body: string }) => {
    const { data } = await apiClient.patch<Comment>(`${issueUrl(scope)}/comments/${commentId}`, { body })
    return data
  },
)

export const deleteComment = createAsyncThunk(
  'issue/deleteComment',
  async ({ commentId, ...scope }: IssueScope & { commentId: string }) => {
    await apiClient.delete(`${issueUrl(scope)}/comments/${commentId}`)
    return commentId
  },
)

export const fetchRelations = createAsyncThunk('issue/fetchRelations', async (scope: IssueScope) => {
  const { data } = await apiClient.get<IssueRelations>(`${issueUrl(scope)}/relations/`)
  return data
})

export const createRelation = createAsyncThunk(
  'issue/createRelation',
  async ({ relatedIssueId, relationType, ...scope }: IssueScope & { relatedIssueId: string; relationType: RelationType }) => {
    await apiClient.post(`${issueUrl(scope)}/relations/`, {
      related_issue_id: relatedIssueId,
      relation_type: relationType,
    })
    return apiClient.get<IssueRelations>(`${issueUrl(scope)}/relations/`).then((res) => res.data)
  },
)

export const deleteRelation = createAsyncThunk(
  'issue/deleteRelation',
  async ({ linkId, ...scope }: IssueScope & { linkId: string }) => {
    await apiClient.delete(`${issueUrl(scope)}/relations/${linkId}`)
    return apiClient.get<IssueRelations>(`${issueUrl(scope)}/relations/`).then((res) => res.data)
  },
)

export const fetchActivity = createAsyncThunk('issue/fetchActivity', async (scope: IssueScope) => {
  const { data } = await apiClient.get<{ data: ActivityEntry[]; next_cursor: string | null }>(
    `${issueUrl(scope)}/activity/`,
  )
  return data.data
})

export const fetchAttachments = createAsyncThunk('issue/fetchAttachments', async (scope: IssueScope) => {
  const { data } = await apiClient.get<Attachment[]>(`${issueUrl(scope)}/attachments/`)
  return data
})

export const registerAttachment = createAsyncThunk(
  'issue/registerAttachment',
  async ({
    file,
    ...scope
  }: IssueScope & { file: File }) => {
    const { data } = await apiClient.post<{ attachment: Attachment; upload: { url: string; fields?: Record<string, string> } }>(
      `${issueUrl(scope)}/attachments/`,
      { file_name: file.name, file_size: file.size, mime_type: file.type },
    )
    await fetch(data.upload.url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
    return data.attachment
  },
)

export const deleteAttachment = createAsyncThunk(
  'issue/deleteAttachment',
  async ({ workspaceSlug, projectId, attachmentId }: ProjectScope & { attachmentId: string }) => {
    await apiClient.delete(`/workspaces/${workspaceSlug}/projects/${projectId}/attachments/${attachmentId}`)
    return attachmentId
  },
)

const issueSlice = createSlice({
  name: 'issue',
  initialState,
  reducers: {
    clearCurrentIssue: (state) => {
      state.current = null
      state.comments = []
      state.activity = []
      state.relations = null
      state.attachments = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIssues.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.items = action.payload.data
        state.groups = action.payload.groups ?? null
        state.nextCursor = action.payload.next_cursor
        state.isLoading = false
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message ?? 'Failed to load issues'
      })
      .addCase(deleteIssue.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload)
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload)
      })
      .addCase(editComment.fulfilled, (state, action) => {
        const idx = state.comments.findIndex((c) => c.id === action.payload.id)
        if (idx >= 0) state.comments[idx] = action.payload
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c.id !== action.payload)
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.activity = action.payload
      })
      .addCase(fetchAttachments.fulfilled, (state, action) => {
        state.attachments = action.payload
      })
      .addCase(registerAttachment.fulfilled, (state, action) => {
        state.attachments.push(action.payload)
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        state.attachments = state.attachments.filter((a) => a.id !== action.payload)
      })
      .addMatcher(
        (action) => [fetchRelations.fulfilled.type, createRelation.fulfilled.type, deleteRelation.fulfilled.type].includes(action.type),
        (state, action: { payload: IssueRelations }) => {
          state.relations = action.payload
        },
      )
      .addMatcher(
        (action) =>
          [
            createIssue.fulfilled.type,
            fetchIssue.fulfilled.type,
            updateIssue.fulfilled.type,
            addAssignee.fulfilled.type,
            removeAssignee.fulfilled.type,
            attachLabel.fulfilled.type,
            detachLabel.fulfilled.type,
          ].includes(action.type),
        (state, action: { payload: Issue }) => {
          state.current = action.payload
          const idx = state.items.findIndex((i) => i.id === action.payload.id)
          if (idx >= 0) state.items[idx] = action.payload
        },
      )
  },
})

export const { clearCurrentIssue } = issueSlice.actions
export default issueSlice.reducer
