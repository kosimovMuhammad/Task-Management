import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background text-center text-foreground">
      <h1 className="text-2xl font-semibold">{t('errors.notFound')}</h1>
      <p className="text-muted-foreground">{t('errors.notFoundDescription')}</p>
      <Link to="/" className={cn(buttonVariants({ variant: 'default' }))}>
        {t('errors.goHome')}
      </Link>
    </div>
  )
}
