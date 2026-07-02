import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { updateMe } from '@/features/auth/authSlice'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function UserSettingsProfilePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
      setAvatarUrl(user.avatar_url ?? '')
    }
  }, [user])

  if (!user) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaved(false)
    try {
      await dispatch(updateMe({ display_name: displayName, avatar_url: avatarUrl || null })).unwrap()
      setSaved(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('userSettings.profileTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('userSettings.profileSubtitle')}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-lg font-semibold text-primary">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
          ) : (
            initials(displayName || user.email)
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <label htmlFor="avatar-url" className="text-sm font-medium">
            {t('userSettings.avatarUrl')}
          </label>
          <Input
            id="avatar-url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="profile-name" className="text-sm font-medium">
          {t('auth.displayName')}
        </label>
        <Input id="profile-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('auth.emailAddress')}</label>
        <Input value={user.email} disabled />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('common.loading') : t('common.save')}
        </Button>
        {saved && <span className="text-sm text-green-500">{t('projectSettings.saved')}</span>}
      </div>
    </form>
  )
}
