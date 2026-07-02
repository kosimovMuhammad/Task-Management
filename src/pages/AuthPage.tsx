import './AuthPage.css'
import { useState, useMemo, type FormEvent, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Mail,
  User,
  Lock,
  CheckCircle2,
  Layers3,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { login, register } from '@/features/auth/authSlice'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Determine initial mode from URL
  const initialMode: AuthMode = window.location.pathname.includes('register') ? 'signup' : 'signin'
  const [mode, setMode] = useState<AuthMode>(initialMode)

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Sign up state
  const [displayName, setDisplayName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [inviteToken, setInviteToken] = useState(searchParams.get('invite_token') ?? '')

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Animation mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await dispatch(login({ email: loginEmail, password: loginPassword })).unwrap()
      navigate(searchParams.get('redirect') || '/', { replace: true })
    } catch {
      setError(t('auth.loginError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (regPassword.length < 8) {
      setError(t('auth.passwordTooShort'))
      return
    }
    setIsSubmitting(true)
    try {
      await dispatch(
        register({
          display_name: displayName,
          email: regEmail,
          password: regPassword,
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

  const switchMode = (newMode: AuthMode) => {
    if (newMode === mode) return
    setError(null)
    setMode(newMode)
    // Update URL without reload
    const newPath = newMode === 'signup' ? '/register' : '/login'
    window.history.replaceState(null, '', newPath)
  }

  const isSignUp = mode === 'signup'

  // Pre-compute particle positions so they stay stable across re-renders
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 13) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        delay: `${(i * 0.27) % 8}s`,
        duration: `${6 + (i * 0.43) % 8}s`,
        size: `${2 + (i * 0.17) % 3}px`,
      })),
    [],
  )

  return (
    <div className="auth-page dark">
      {/* Animated background particles */}
      <div className="auth-bg-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="auth-particle"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>

      <div className={`auth-container ${mounted ? 'auth-mounted' : ''}`}>
        {/* Branding Panel */}
        <div className={`auth-brand-panel ${isSignUp ? 'auth-brand-right' : 'auth-brand-left'}`}>
          <div className="auth-brand-content">
            {/* Logo */}
            <div className="auth-logo">
              <div className="auth-logo-dot" />
              <span>{t('app.name')}</span>
            </div>

            {/* 3D Geometric Shape */}
            <div className="auth-geo-wrapper">
              <IcosahedronVisualization />
            </div>

            {/* Tagline */}
            <div className="auth-tagline">
              <h2>Ship work, not busywork.</h2>
              <p>Plan, track and deliver across every workspace from one calm, fast command center.</p>
            </div>

            {/* Feature list */}
            <div className="auth-features">
              <div className="auth-feature-item">
                <CheckCircle2 className="auth-feature-icon" />
                <span>Real-time boards & cycles</span>
              </div>
              <div className="auth-feature-item">
                <Layers3 className="auth-feature-icon" />
                <span>Modules, labels & relations</span>
              </div>
              <div className="auth-feature-item">
                <ShieldCheck className="auth-feature-icon" />
                <span>Secure JWT-backed workspaces</span>
              </div>
            </div>

            <p className="auth-brand-footer">The agile OS your team actually enjoys.</p>
          </div>
        </div>

        {/* Form Panel */}
        <div className={`auth-form-panel ${isSignUp ? 'auth-form-left' : 'auth-form-right'}`}>
          <div className="auth-form-card">
            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'signin' ? 'auth-tab-active' : ''}`}
                onClick={() => switchMode('signin')}
                type="button"
              >
                Sign in
              </button>
              <button
                className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`}
                onClick={() => switchMode('signup')}
                type="button"
              >
                Sign up
              </button>
            </div>

            {/* Form Content */}
            <div className="auth-form-body">
              {mode === 'signin' ? (
                <>
                  <div className="auth-form-header">
                    <h1>Welcome back</h1>
                    <p>Sign in to continue to your workspace.</p>
                  </div>

                  <form onSubmit={(e) => void handleLogin(e)} className="auth-form">
                    <div className="auth-field">
                      <label htmlFor="login-email">{t('auth.email')}</label>
                      <div className="auth-input-wrap">
                        <Mail className="auth-input-icon" />
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@team.com"
                          className="auth-input"
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="login-password">{t('auth.password')}</label>
                        <button type="button" className="auth-forgot-link">
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                      <div className="auth-input-wrap">
                        <Lock className="auth-input-icon" />
                        <Input
                          id="login-password"
                          type="password"
                          autoComplete="current-password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="auth-input"
                        />
                        <Eye className="auth-input-icon-right" />
                      </div>
                    </div>

                    <label className="auth-remember">
                      <input type="checkbox" defaultChecked className="auth-checkbox" />
                      <span>Remember me on this device</span>
                    </label>

                    {error && <p className="auth-error">{error}</p>}

                    <Button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? t('common.loading') : (
                        <>
                          Sign in <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="auth-switch-text">
                    No account?{' '}
                    <button type="button" className="auth-switch-link" onClick={() => switchMode('signup')}>
                      Sign up
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <div className="auth-form-header">
                    <h1>{t('auth.createAccountTitle')}</h1>
                    <p>{t('auth.createAccountSubtitle')}</p>
                  </div>

                  <form onSubmit={(e) => void handleRegister(e)} className="auth-form">
                    <div className="auth-field">
                      <label htmlFor="reg-name">{t('auth.displayName')}</label>
                      <div className="auth-input-wrap">
                        <User className="auth-input-icon" />
                        <Input
                          id="reg-name"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          className="auth-input"
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="reg-email">{t('auth.emailAddress')}</label>
                      <div className="auth-input-wrap">
                        <Mail className="auth-input-icon" />
                        <Input
                          id="reg-email"
                          type="email"
                          autoComplete="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="auth-input"
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label htmlFor="reg-password">{t('auth.password')}</label>
                      <div className="auth-input-wrap">
                        <KeyRound className="auth-input-icon" />
                        <Input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="auth-input auth-input-has-right"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="auth-eye-btn"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <p className="auth-hint">{t('auth.passwordHint')}</p>
                    </div>

                    <div className="auth-field">
                      <div className="auth-field-header">
                        <label htmlFor="reg-invite">{t('auth.inviteToken')}</label>
                        <Info className="auth-info-icon" />
                      </div>
                      <Input
                        id="reg-invite"
                        value={inviteToken}
                        onChange={(e) => setInviteToken(e.target.value)}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="auth-input"
                      />
                    </div>

                    {error && <p className="auth-error">{error}</p>}

                    <Button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
                      {isSubmitting ? t('common.loading') : (
                        <>
                          {t('auth.signUp')} <ArrowRight className="size-4" />
                        </>
                      )}
                    </Button>

                    <p className="auth-terms">{t('auth.termsNotice')}</p>
                  </form>

                  <p className="auth-switch-text">
                    {t('auth.haveAccount')}{' '}
                    <button type="button" className="auth-switch-link" onClick={() => switchMode('signin')}>
                      {t('auth.login')}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
   Animated Globe / Geometric Mesh Component
   ────────────────────────────────────────────── */
function GlobeVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    // Generate icosahedron-like vertices for a geometric globe
    const vertices: [number, number, number][] = []
    const numLat = 12
    const numLon = 20
    for (let i = 0; i <= numLat; i++) {
      const lat = (Math.PI * i) / numLat - Math.PI / 2
      for (let j = 0; j < numLon; j++) {
        const lon = (2 * Math.PI * j) / numLon
        vertices.push([
          Math.cos(lat) * Math.cos(lon),
          Math.sin(lat),
          Math.cos(lat) * Math.sin(lon),
        ])
      }
    }

    // Generate edges connecting nearby vertices
    const edges: [number, number][] = []
    for (let i = 0; i <= numLat; i++) {
      for (let j = 0; j < numLon; j++) {
        const idx = i * numLon + j
        // horizontal
        if (j < numLon - 1) edges.push([idx, idx + 1])
        else edges.push([idx, i * numLon])
        // vertical
        if (i < numLat) edges.push([idx, idx + numLon])
        // diagonal
        if (i < numLat && j < numLon - 1) edges.push([idx, idx + numLon + 1])
      }
    }

    const draw = () => {
      time += 0.003
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const radius = Math.min(w, h) * 0.38

      const cosA = Math.cos(time)
      const sinA = Math.sin(time)
      const cosB = Math.cos(time * 0.7)
      const sinB = Math.sin(time * 0.7)

      // Project 3D -> 2D with rotation
      const projected = vertices.map(([x, y, z]) => {
        // Rotate Y
        const x1 = x * cosA - z * sinA
        const z1 = x * sinA + z * cosA
        // Rotate X
        const y1 = y * cosB - z1 * sinB
        const z2 = y * sinB + z1 * cosB
        // Perspective
        const scale = 1 / (1 + z2 * 0.3)
        return {
          x: cx + x1 * radius * scale,
          y: cy + y1 * radius * scale,
          z: z2,
          scale,
        }
      })

      // Draw edges
      for (const [a, b] of edges) {
        const pa = projected[a]
        const pb = projected[b]
        if (!pa || !pb) continue
        const avgZ = (pa.z + pb.z) / 2
        const alpha = Math.max(0.03, Math.min(0.35, 0.2 + avgZ * 0.15))

        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      // Draw vertices as glowing dots
      for (const p of projected) {
        const alpha = Math.max(0.15, Math.min(0.9, 0.5 + p.z * 0.4))
        const r = 1.2 + p.scale * 1.2

        // Glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha * 0.15})`
        ctx.fill()

        // Dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`
        ctx.fill()
      }

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="auth-globe-canvas" />
}
