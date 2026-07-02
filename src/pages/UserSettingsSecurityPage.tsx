import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

function InertRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex cursor-not-allowed items-center justify-between border-b border-border py-3 opacity-50 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </div>
  )
}

export default function UserSettingsSecurityPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('userSettings.security')}</h2>
        <p className="text-sm text-muted-foreground">{t('userSettings.securityComingSoon')}</p>
      </div>
      <div className="rounded-lg border border-border px-4">
        <InertRow title={t('userSettings.twoFactor')} description={t('userSettings.twoFactorHint')} />
        <InertRow title={t('userSettings.changePassword')} description={t('userSettings.changePasswordHint')} />
        <InertRow title={t('userSettings.activeSessions')} description={t('userSettings.activeSessionsHint')} />
      </div>
    </div>
  )
}
