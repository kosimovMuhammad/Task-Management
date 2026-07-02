import { useTranslation } from 'react-i18next'

function ToggleRow({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input type="checkbox" disabled className="size-4 opacity-50" />
    </div>
  )
}

export default function UserSettingsNotificationsPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('userSettings.notifications')}</h2>
        <p className="text-sm text-muted-foreground">{t('userSettings.notificationsComingSoon')}</p>
      </div>
      <div className="rounded-lg border border-border px-4">
        <ToggleRow title={t('userSettings.emailNotifications')} description={t('userSettings.emailNotificationsHint')} />
        <ToggleRow title={t('userSettings.pushNotifications')} description={t('userSettings.pushNotificationsHint')} />
        <ToggleRow title={t('userSettings.weeklyReports')} description={t('userSettings.weeklyReportsHint')} />
      </div>
    </div>
  )
}
