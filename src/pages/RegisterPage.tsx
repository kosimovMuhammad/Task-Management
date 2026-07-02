import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheckBig, Eye, EyeOff, Info, KeyRound, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { register } from '@/features/auth/authSlice'

export default function RegisterPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inviteToken, setInviteToken] = useState(searchParams.get('invite_token') ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'))
      return
    }
    setIsSubmitting(true)
    try {
      await dispatch(
        register({
          display_name: displayName,
          email,
          password,
          invite_token: inviteToken || undefined,
        }),
      ).unwrap()
      navigate('/', { replace: true })
    } catch {
      setError(t('auth.registerError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background p-4 text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <CircleCheckBig className="size-6" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">{t('auth.createAccountTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t('auth.createAccountSubtitle')}</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="display-name" className="text-sm font-medium">
              {t('auth.displayName')}
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="display-name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jane Doe"
                className="h-9 pl-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              {t('auth.emailAddress')}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-9 pl-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              {t('auth.password')}
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 pl-8 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{t('auth.passwordHint')}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1">
              <label htmlFor="invite-token" className="text-sm font-medium">
                {t('auth.inviteToken')}
              </label>
              <Info className="size-3.5 text-muted-foreground" />
            </div>
            <Input
              id="invite-token"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="h-9"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('common.loading') : t('auth.signUp')}
          </Button>

          <p className="text-center text-xs text-muted-foreground">{t('auth.termsNotice')}</p>
        </form>
      </div>

      <p className="text-sm text-muted-foreground">
        {t('auth.haveAccount')} <Link to="/login" className="text-primary hover:underline">{t('auth.login')}</Link>
      </p>
    </div>
  )
}
