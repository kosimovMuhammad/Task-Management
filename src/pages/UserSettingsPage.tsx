import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'
import { Bell, CreditCard, Shield, User, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  )
}

export default function UserSettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex max-w-4xl gap-8 p-6">
      <nav className="flex w-48 shrink-0 flex-col gap-1">
        <p className="mb-1 px-2.5 text-xs font-semibold uppercase text-muted-foreground">
          {t('userSettings.categories')}
        </p>
        <NavLink to="/settings/profile" className={navClass}>
          <User className="size-4" />
          {t('userSettings.profile')}
        </NavLink>
        <NavLink to="/settings/notifications" className={navClass}>
          <Bell className="size-4" />
          {t('userSettings.notifications')}
        </NavLink>
        <NavLink to="/settings/security" className={navClass}>
          <Shield className="size-4" />
          {t('userSettings.security')}
        </NavLink>
        <NavLink to="/settings/workspace" className={navClass}>
          <Building2 className="size-4" />
          {t('userSettings.workspace')}
        </NavLink>
        <NavLink to="/settings/billing" className={navClass}>
          <CreditCard className="size-4" />
          {t('userSettings.billing')}
        </NavLink>
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
