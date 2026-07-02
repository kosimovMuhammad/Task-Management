import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-svh items-center justify-center bg-background text-foreground">
      <h1 className="text-2xl font-semibold">{t('auth.login')}</h1>
    </div>
  )
}
