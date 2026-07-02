import { useTranslation } from 'react-i18next'
import { CreditCard } from 'lucide-react'

export default function UserSettingsBillingPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-lg">
      <h2 className="mb-4 text-lg font-semibold">{t('userSettings.billing')}</h2>
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
        <CreditCard className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('common.comingSoon')}</p>
      </div>
    </div>
  )
}
