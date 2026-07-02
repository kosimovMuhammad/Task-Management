import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { Loader } from '@/components/shared/Loader'
import { AuthenticatedLayout } from '@/app/layouts/AuthenticatedLayout'
import { WorkspaceScope } from '@/app/layouts/WorkspaceScope'
import { ProjectLayout } from '@/app/layouts/ProjectLayout'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const RootRedirect = lazy(() => import('@/pages/RootRedirect'))
const CreateWorkspacePage = lazy(() => import('@/pages/CreateWorkspacePage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProjectsListPage = lazy(() => import('@/pages/ProjectsListPage'))
const IssuesListPage = lazy(() => import('@/pages/IssuesListPage'))
const IssueDetailPage = lazy(() => import('@/pages/IssueDetailPage'))
const CyclesOverviewPage = lazy(() => import('@/pages/CyclesOverviewPage'))
const ProjectSettingsPage = lazy(() => import('@/pages/ProjectSettingsPage'))
const ProjectSettingsGeneralPage = lazy(() => import('@/pages/ProjectSettingsGeneralPage'))
const ProjectSettingsMembersPage = lazy(() => import('@/pages/ProjectSettingsMembersPage'))
const ProjectSettingsStatesPage = lazy(() => import('@/pages/ProjectSettingsStatesPage'))
const ProjectSettingsLabelsPage = lazy(() => import('@/pages/ProjectSettingsLabelsPage'))
const UserSettingsPage = lazy(() => import('@/pages/UserSettingsPage'))

function SuspenseLayout() {
  return (
    <Suspense fallback={<Loader />}>
      <Outlet />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <SuspenseLayout />,
    children: [
      {
        // public shell
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        // authenticated shell
        element: <ProtectedRoute />,
        children: [
          {
            element: <AuthenticatedLayout />,
            children: [
              { path: '/', element: <RootRedirect /> },
              { path: '/workspaces/new', element: <CreateWorkspacePage /> },
              { path: '/settings/*', element: <UserSettingsPage /> },
              {
                path: '/w/:workspaceSlug',
                element: <WorkspaceScope />,
                children: [
                  { index: true, element: <DashboardPage /> },
                  { path: 'projects', element: <ProjectsListPage /> },
                  {
                    path: 'p/:projectId',
                    children: [
                      {
                        element: <ProjectLayout />,
                        children: [
                          { path: 'issues', element: <IssuesListPage /> },
                          { path: 'cycles', element: <CyclesOverviewPage /> },
                          {
                            path: 'settings',
                            element: <ProjectSettingsPage />,
                            children: [
                              { index: true, element: <Navigate to="general" replace /> },
                              { path: 'general', element: <ProjectSettingsGeneralPage /> },
                              { path: 'members', element: <ProjectSettingsMembersPage /> },
                              { path: 'states', element: <ProjectSettingsStatesPage /> },
                              { path: 'labels', element: <ProjectSettingsLabelsPage /> },
                            ],
                          },
                        ],
                      },
                      { path: 'issues/:issueId', element: <IssueDetailPage /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
