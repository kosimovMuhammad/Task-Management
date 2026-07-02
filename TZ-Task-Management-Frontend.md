# Task-Management — Frontend Technical Specification (TZ)

> Master prompt for Claude Code. Follow this document as the single source of truth.
> Execute strictly against `swagger.json` / the live API contract below — never invent endpoints.

---

## 0. Meta

| Key | Value |
|---|---|
| Repository branch | **`MUHAMMAD`** — all work happens here. Create it from `main`/`dev` if it doesn't exist yet. |
| Backend base URL | `https://task-management-backend-2-spya.onrender.com/api/v1` |
| Auth | Bearer JWT (`access_token` + `refresh_token`), rotated via `/auth/refresh` |
| Frontend stack | React + TypeScript + Vite |

### Git / workflow rules (important — follow exactly)
1. Work in small, reviewable increments (one page or one feature slice at a time).
2. After **every** completed increment ("stop point"):
   - `git add -A`
   - `git commit -m "feat(<scope>): <short description>"` (Conventional Commits)
   - `git push origin MUHAMMAD`
3. Never force-push. Never commit directly to `main`/`dev`.
4. Before starting new work, `git pull --rebase origin MUHAMMAD`.
5. Ask for confirmation before running any destructive git command (reset --hard, force push, branch delete).

---

## 1. Mandatory Tech Stack

| Requirement | Notes |
|---|---|
| **TypeScript** | Strict mode on. No implicit `any`. |
| **Redux Toolkit** | All server state via slices + `createAsyncThunk`. No component-local fetch calls. |
| **shadcn/ui** | All primitives (Button, Input, Dialog, DropdownMenu, Table, Tabs, Toast, Skeleton, etc.) sourced from shadcn, themed via CSS variables — do not hand-roll basic UI atoms. |
| **Dark / Light mode** | CSS-variable based theme, toggle persisted (Zustand or a `themeSlice`), respects `prefers-color-scheme` on first load. |
| **i18n** | RU / EN / TJ (matches existing project convention). Namespaced JSON resource files, `useTranslation` hook, language switcher in Settings + top bar. |
| **React Router DOM** | v6+, nested routes, layout routes for authenticated shell vs public shell. |
| **Path aliases** | `@/components`, `@/features`, `@/pages`, `@/lib`, `@/hooks`, `@/store`, `@/types`, `@/i18n` configured in `tsconfig.json` + `vite.config.ts`. |
| **createAsyncThunk** | Every API call wrapped in a thunk per slice; standard `pending/fulfilled/rejected` handling. |
| **ErrorBoundary** | One global boundary at the app root + optional route-level boundaries for heavy pages (Issue Detail, Dashboard). |
| **Loading states** | Skeleton components (shadcn `Skeleton`) for lists/detail views; a top-level route-transition loading bar (e.g. thin progress bar) for lazy-loaded chunks. |
| **404 / NotFound** | Catch-all route (`path="*"`) with a dedicated `NotFoundPage`. |
| **ProtectedRoute** | Wrapper component that checks auth state, redirects to `/login` with `?redirect=` param when unauthenticated. |
| **AuthProvider** | Context/provider that bootstraps session on app load (reads token from storage, calls `/auth/me`, silently refreshes via `/auth/refresh`, exposes `login/logout/register`). |
| **Lazy loading** | All page-level components loaded via `React.lazy` + `Suspense`, split per route. |
| **.env** | `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_DEFAULT_LOCALE`, `VITE_SENTRY_DSN` (optional) — never hardcode the backend URL in code. |

---

## 2. Folder Structure

```
src/
  app/
    App.tsx
    router.tsx
    providers/          # AuthProvider, ThemeProvider, I18nProvider
  pages/                 # route-level components (lazy-loaded)
  features/              # redux slices, grouped by domain
    auth/
    workspaces/
    projects/
    issues/
    cycles/
    modules/
    states/
    labels/
    comments/
    relations/
    activity/
    attachments/
    notifications/
    invites/
    ui/                  # theme + global ui slice
  components/
    ui/                  # shadcn primitives
    shared/               # ProtectedRoute, ErrorBoundary, NotFound, Loader, LangSwitcher, ThemeToggle
  hooks/
  lib/
    apiClient.ts          # axios/fetch wrapper, interceptors, refresh logic
  i18n/
    en/ ru/ tj/
  store/
    store.ts
  types/
  env.d.ts
```

---

## 3. Routing Map & Gap Analysis

**Existing designs (v0.app, already produced — reuse/polish, do not redesign from scratch):**
Dashboard Home, Issues List, Settings, Project Settings, Issue Detail View, Cycles Management, Project Labels, Login, Register.

**Cross-checked against the swagger contract** — the following pages are **required by the API but missing from the current design set**. Claude Code must design + build these too, matching the existing dark theme/visual language:

| # | Missing page | Route (suggested) | Key endpoints |
|---|---|---|---|
| 1 | Workspace List / Switcher + Create Workspace | `/workspaces` | `GET/POST /workspaces/` |
| 2 | Workspace Settings (rename, slug, delete) | `/w/:slug/settings/workspace` | `PATCH/DELETE /workspaces/{slug}` |
| 3 | Workspace Members & Invite management | `/w/:slug/settings/members` | `GET/POST /workspaces/{slug}/members`, `PATCH/DELETE .../members/{userId}`, `POST .../members/invite` |
| 4 | Projects List (within a workspace) | `/w/:slug/projects` | `GET/POST /workspaces/{slug}/projects/` |
| 5 | Project Members management | `/w/:slug/p/:projectId/settings/members` | `GET/POST/DELETE .../projects/{id}/members` |
| 6 | Modules Management (parallel to Cycles) | `/w/:slug/p/:projectId/modules` | full `/modules/` CRUD + issue linking |
| 7 | Workflow States management | `/w/:slug/p/:projectId/settings/states` | full `/states/` CRUD |
| 8 | Notifications Center | `/w/:slug/notifications` | `GET .../notifications/`, mark read (single + all) |
| 9 | Invite Accept (public page, token-based) | `/invite/:token` | `GET /invites/{token}`, `POST /invites/{token}/accept` |
| 10 | Global 404 | `*` | — |

Additionally, verify the existing **Issue Detail View** design already covers, or extend it with, these sub-panels (all backed by existing endpoints — no new page needed, just tabs/sections):
- Comments (threaded, `parent_comment_id`)
- Activity log
- Attachments (presigned upload flow: register → PUT bytes to presigned URL)
- Relations (blocks / blocked_by / relates_to / duplicates)
- Assignees & Labels editing

> **Rule for Claude Code:** before building anything, diff the current repo's `src/pages` against this table. Only scaffold pages that don't already exist; if a page partially exists, extend it — never duplicate.

---

## 4. Redux Toolkit Slices

One slice per domain, each with `createAsyncThunk` actions mapped 1:1 to the endpoints below.

| Slice | Thunks (examples) |
|---|---|
| `authSlice` | `register`, `login`, `logout`, `fetchMe`, `updateMe`, `refreshToken` |
| `workspaceSlice` | `fetchWorkspaces`, `createWorkspace`, `fetchWorkspace`, `updateWorkspace`, `deleteWorkspace` |
| `workspaceMembersSlice` | `fetchMembers`, `addMember`, `changeMemberRole`, `removeMember`, `inviteMember` |
| `projectSlice` | `fetchProjects`, `createProject`, `fetchProject`, `updateProject`, `deleteProject` |
| `projectMembersSlice` | `fetchProjectMembers`, `addProjectMember`, `removeProjectMember` |
| `stateSlice` | `fetchStates`, `createState`, `updateState`, `deleteState` |
| `labelSlice` | `fetchLabels`, `createLabel`, `updateLabel`, `deleteLabel` |
| `issueSlice` | `fetchIssues` (filters + cursor pagination), `createIssue`, `fetchIssue`, `updateIssue`, `deleteIssue`, `addAssignee`, `removeAssignee`, `attachLabel`, `detachLabel` |
| `cycleSlice` | `fetchCycles`, `createCycle`, `fetchCycle`, `updateCycle`, `deleteCycle`, `addIssuesToCycle`, `removeIssueFromCycle` |
| `moduleSlice` | `fetchModules`, `createModule`, `fetchModule`, `updateModule`, `deleteModule`, `addIssuesToModule`, `removeIssueFromModule` |
| `commentSlice` | `fetchComments`, `addComment`, `editComment`, `deleteComment` |
| `relationSlice` | `fetchRelations`, `createRelation`, `deleteRelation` |
| `activitySlice` | `fetchActivity` (cursor pagination) |
| `attachmentSlice` | `fetchAttachments`, `registerAttachment` + upload-to-presigned-URL, `deleteAttachment` |
| `notificationSlice` | `fetchNotifications`, `markAllRead`, `markOneRead` |
| `inviteSlice` | `fetchInviteByToken`, `acceptInvite` |
| `uiSlice` | `theme` (light/dark), `locale` (en/ru/tj) — persisted to localStorage |

`apiClient.ts` should centralize base URL (from `.env`), attach the Bearer token, and auto-refresh on 401 once via `/auth/refresh` before failing.

---

## 5. Auth & Route Protection

- **`AuthProvider`**: on mount, reads tokens from storage → calls `GET /auth/me` → sets user in `authSlice`. Exposes `isAuthenticated`, `isLoading`.
- **`ProtectedRoute`**: renders `<Outlet/>` if authenticated; otherwise `<Navigate to="/login?redirect=..." />`.
- **Public routes**: `/login`, `/register`, `/invite/:token`.
- **Invite acceptance flow**: unauthenticated user hitting `/invite/:token` sees workspace/inviter preview (`GET /invites/{token}`) with a CTA to log in/register, then calls `POST /invites/{token}/accept` and redirects into the workspace.

---

## 6. UI / UX Requirements

- Reuse the existing dark theme tokens visible in the current designs (deep navy background, blue accent, subtle borders) as the **dark** theme; derive a matching **light** theme from the same palette (do not just invert colors — keep contrast/accessibility in mind).
- Every list/detail page shows shadcn `Skeleton` placeholders while its thunk is `pending`.
- Every mutation (create/update/delete) shows a `Toast` on success/error.
- Empty states (no issues, no cycles, no modules, no notifications) need a simple illustration/message + primary action button.

---

## 7. Environment Variables (`.env.example`)

```
VITE_API_BASE_URL=https://task-management-backend-2-spya.onrender.com/api/v1
VITE_APP_NAME=Task Management
VITE_DEFAULT_LOCALE=ru
```

---

## 8. Execution Order (suggested milestones — one commit+push per milestone)

1. Scaffolding: router, aliases, env, ThemeProvider, I18nProvider, AuthProvider, apiClient, store.
2. Auth pages (Login/Register — polish existing) + ProtectedRoute + NotFound + ErrorBoundary.
3. Workspace List/Create + Workspace Settings + Workspace Members (missing pages #1–3).
4. Projects List + Project Settings (polish existing) + Project Members (missing pages #4–5).
5. Issues List (polish existing) + Issue Detail View (polish/extend with comments, activity, attachments, relations tabs).
6. Cycles Management (polish existing) + Modules Management (missing page #6).
7. Project Labels (polish existing) + Workflow States management (missing page #7).
8. Notifications Center + Invite Accept page (missing pages #8–9).
9. Final pass: dark/light QA, i18n completeness (en/ru/tj), loading/error states, lazy-loading verification.

---

## 9. Acceptance Checklist

- [ ] Branch `MUHAMMAD` used for all commits, pushed after each milestone.
- [ ] All 9 existing pages preserved/polished, none rebuilt from scratch.
- [ ] All 9 missing pages from the gap analysis added.
- [ ] Every API call goes through a Redux `createAsyncThunk`.
- [ ] Dark/light mode toggle works app-wide.
- [ ] i18n works for en/ru/tj with no missing keys.
- [ ] All routes lazy-loaded; 404 and ErrorBoundary verified.
- [ ] ProtectedRoute blocks unauthenticated access; invite flow works end-to-end.
- [ ] `.env.example` present; no hardcoded URLs in source.
