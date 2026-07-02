import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Building2, Kanban, RotateCw, Zap } from 'lucide-react'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setLocale, type Locale } from '@/features/ui/uiSlice'
import { Logo } from '@/components/shared/Logo'
import dashboardShot from '@/assets/screenshots/dashboard.png'
import kanbanShot from '@/assets/screenshots/kanban.png'
import cyclesShot from '@/assets/screenshots/cycles.png'
import issueDetailShot from '@/assets/screenshots/issue-detail.png'
import './LandingPage.css'

const LOCALES: Locale[] = ['en', 'ru', 'tj']

const FEATURES = [
  { icon: Building2, key: 'workspaces' },
  { icon: Kanban, key: 'issues' },
  { icon: RotateCw, key: 'cycles' },
  { icon: Zap, key: 'realtime' },
] as const

const SHOWCASE = [
  { key: 'dashboard', src: dashboardShot },
  { key: 'kanban', src: kanbanShot },
  { key: 'cycles', src: cyclesShot },
  { key: 'issueDetail', src: issueDetailShot },
] as const

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const locale = useAppSelector((state) => state.ui.locale)

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const cycleLocale = () => {
    const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]
    dispatch(setLocale(next))
    void i18n.changeLanguage(next)
  }

  return (
    <div className="landing-page">
      <div className="landing-content">
        <nav className="landing-nav">
          <Logo />

          <div className="landing-nav-actions">
            <button className="landing-nav-item" onClick={cycleLocale}>
              {locale.toUpperCase()}
            </button>
            <Link to="/register" className="landing-nav-link">
              {t('auth.signUp')}
            </Link>
            <Link to="/login" className="landing-login-btn">
              <ArrowRight className="size-4" /> {t('auth.login')}
            </Link>
          </div>
        </nav>

        <main className="landing-hero">
          <div className="landing-pill">
            <div className="landing-pill-dot" />
            <span className="landing-pill-text">{t('landing.pill')}</span>
          </div>

          <h1 className="landing-title">
            {t('landing.title1')}
            <span className="landing-title-line2">{t('landing.title2')}</span>
          </h1>

          <p className="landing-subtitle">{t('landing.subtitle')}</p>

          <div className="landing-actions">
            <Link to="/register" className="landing-primary-btn">
              {t('landing.ctaPrimary')} <ArrowRight className="size-4" />
            </Link>
            <Link to="/login" className="landing-secondary-link">
              {t('landing.ctaSecondary')}
            </Link>
          </div>
        </main>

        <section className="landing-features">
          {FEATURES.map(({ icon: Icon, key }) => (
            <div key={key} className="landing-feature-card">
              <div className="landing-feature-icon">
                <Icon className="size-5" />
              </div>
              <h3 className="landing-feature-title">{t(`landing.features.${key}.title`)}</h3>
              <p className="landing-feature-description">{t(`landing.features.${key}.description`)}</p>
            </div>
          ))}
        </section>

        <section className="landing-showcase">
          <h2 className="landing-showcase-title">{t('landing.showcase.title')}</h2>
          <p className="landing-showcase-subtitle">{t('landing.showcase.subtitle')}</p>

          <div className="landing-showcase-grid">
            {SHOWCASE.map(({ key, src }) => (
              <div key={key} className="landing-showcase-card">
                <div className="landing-browser-chrome">
                  <span className="landing-browser-dot" />
                  <span className="landing-browser-dot" />
                  <span className="landing-browser-dot" />
                </div>
                <img src={src} alt={t(`landing.showcase.${key}`)} className="landing-showcase-img" />
                <p className="landing-showcase-caption">{t(`landing.showcase.${key}`)}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="landing-footer">
          <Logo size={24} />
          <p className="landing-footer-tagline">{t('landing.footerTagline')}</p>
        </footer>
      </div>
    </div>
  )
}
