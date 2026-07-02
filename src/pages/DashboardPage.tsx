import { useTranslation } from 'react-i18next'
import { LangSwitcher } from '@/components/shared/LangSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useAppSelector } from '@/hooks/useAppSelector'

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border p-4">
        <h1 className="text-lg font-semibold">{t('nav.dashboard')}</h1>
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="p-4">
        <p className="text-muted-foreground">{user?.email ?? t('common.loading')}</p>
      </main>
    </div>
  )
}
