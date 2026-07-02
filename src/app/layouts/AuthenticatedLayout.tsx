import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { TopBar } from '@/components/shared/TopBar'

export function AuthenticatedLayout() {
  return (
    <div className="flex h-svh bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
