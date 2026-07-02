import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { Loader } from '@/components/shared/Loader'
import { AuthenticatedLayout } from '@/app/layouts/AuthenticatedLayout'
import { WorkspaceScope } from '@/app/layouts/WorkspaceScope'

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
                  { path: 'p/:projectId/issues', element: <IssuesListPage /> },
                  { path: 'p/:projectId/issues/:issueId', element: <IssueDetailPage /> },
                  { path: 'p/:projectId/cycles', element: <CyclesOverviewPage /> },
                  { path: 'p/:projectId/settings/*', element: <ProjectSettingsPage /> },
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
