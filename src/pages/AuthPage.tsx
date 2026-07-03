import './AuthPage.css'
import { useState, useMemo, type FormEvent, useEffect, useRef, useCallback } from 'react'
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
import { LogoMark } from '@/components/shared/Logo'

type AuthMode = 'signin' | 'signup'

export default function AuthPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialMode: AuthMode = window.location.pathname.includes('register') ? 'signup' : 'signin'
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [isAnimating, setIsAnimating] = useState(false)

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
      navigate(searchParams.get('redirect') || '/app', { replace: true })
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err?.message || t('auth.loginError'))
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
      navigate('/app', { replace: true })
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err?.message || t('auth.registerError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = useCallback((newMode: AuthMode) => {
    if (newMode === mode || isAnimating) return
    setError(null)
    setIsAnimating(true)
    setMode(newMode)
    const newPath = newMode === 'signup' ? '/register' : '/login'
    window.history.replaceState(null, '', newPath)
    setTimeout(() => setIsAnimating(false), 700)
  }, [mode, isAnimating])

  const isSignUp = mode === 'signup'

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 13) % 100}%`,
        top: `${(i * 53 + 7) % 100}%`,
        delay: `${(i * 0.27) % 8}s`,
        duration: `${6 + (i * 0.43) % 8}s`,
        size: `${1.5 + (i * 0.17) % 2}px`,
      })),
    [],
  )

  return (
    <div className="auth-page dark">
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
            <div className="auth-logo">
              <LogoMark size={22} />
              <span>{t('app.name')}</span>
            </div>

            {/* Tagline — above globe */}
            <div className="auth-tagline">
              <h2>Ship work, not busywork.</h2>
              <p>Plan, track and deliver across every workspace from one calm, fast command center.</p>
            </div>

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

            {/* Globe — below text */}
            <div className="auth-globe-wrapper">
              <GlobeVisualization />
            </div>

            <p className="auth-brand-footer">The agile OS your team actually enjoys.</p>
          </div>
        </div>

        {/* Form Panel */}
        <div className={`auth-form-panel ${isSignUp ? 'auth-form-left' : 'auth-form-right'}`}>
          <div className="auth-form-card">
            {/* Tabs with sliding indicator */}
            <div className="auth-tabs">
              <div className={`auth-tab-indicator ${isSignUp ? 'auth-tab-indicator-right' : ''}`} />
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
            <div className="auth-form-body" key={mode}>
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
                    {/* Name & Email Side-by-Side */}
                    <div className="auth-form-row">
                      <div className="auth-field">
                        <label htmlFor="reg-name">{t('auth.displayName')}</label>
                        <div className="auth-input-wrap">
                          <User className="auth-input-icon" />
                          <Input
                            id="reg-name"
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Jane Doe"
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
                            placeholder="name@team.com"
                            className="auth-input"
                          />
                        </div>
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
   Large Animated Globe – Wireframe Sphere Mesh
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

    // Sphere mesh — latitude/longitude grid
    const numLat = 14
    const numLon = 24
    const vertices: [number, number, number][] = []
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

    const edges: [number, number][] = []
    for (let i = 0; i <= numLat; i++) {
      for (let j = 0; j < numLon; j++) {
        const idx = i * numLon + j
        // Horizontal rings
        const next = j < numLon - 1 ? idx + 1 : i * numLon
        edges.push([idx, next])
        // Vertical meridians
        if (i < numLat) edges.push([idx, idx + numLon])
        // Diagonals for triangulated mesh
        if (i < numLat) {
          const diagNext = j < numLon - 1 ? idx + numLon + 1 : (i + 1) * numLon
          edges.push([idx, diagNext])
        }
      }
    }

    const draw = () => {
      time += 0.002
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const radius = Math.min(w, h) * 0.44

      const cosA = Math.cos(time)
      const sinA = Math.sin(time)
      const cosB = Math.cos(time * 0.6 + 0.5)
      const sinB = Math.sin(time * 0.6 + 0.5)

      const projected = vertices.map(([x, y, z]) => {
        const x1 = x * cosA - z * sinA
        const z1 = x * sinA + z * cosA
        const y1 = y * cosB - z1 * sinB
        const z2 = y * sinB + z1 * cosB
        const perspective = 3.2
        const scale = perspective / (perspective + z2)
        return {
          x: cx + x1 * radius * scale,
          y: cy + y1 * radius * scale,
          z: z2,
          scale,
        }
      })

      // Draw edges with depth-based opacity
      for (const [a, b] of edges) {
        const pa = projected[a]
        const pb = projected[b]
        if (!pa || !pb) continue
        const avgZ = (pa.z + pb.z) / 2
        const alpha = Math.max(0.015, Math.min(0.3, 0.14 + avgZ * 0.16))
        const lineW = Math.max(0.3, 0.5 + avgZ * 0.3)

        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`
        ctx.lineWidth = lineW
        ctx.stroke()
      }

      // Draw vertices — only bright front-facing ones
      for (const p of projected) {
        if (p.z < -0.3) continue // skip back-facing
        const alpha = Math.max(0.1, Math.min(0.95, 0.4 + p.z * 0.55))
        const r = 1 + p.scale * 1.8

        // Glow halo
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4)
        grad.addColorStop(0, `rgba(167, 139, 250, ${alpha * 0.25})`)
        grad.addColorStop(1, 'rgba(167, 139, 250, 0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(192, 168, 255, ${alpha})`
        ctx.fill()

        // White hot center
        if (alpha > 0.6) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${(alpha - 0.6) * 2})`
          ctx.fill()
        }
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
