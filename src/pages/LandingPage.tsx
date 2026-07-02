import React, { useState, useRef } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Sparkles, ArrowRight, Code2, Network, Cpu, Layers, Globe, LayoutTemplate, UserPlus, FileText, LineChart, CheckCircle, Sun, Moon } from 'lucide-react'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setLocale, toggleTheme, type Locale } from '@/features/ui/uiSlice'
import { Logo } from '@/components/shared/Logo'
import './LandingPage.css'

const LOCALES: Locale[] = ['en', 'ru', 'tj']

export default function LandingPage() {
  const { i18n, t } = useTranslation()
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const theme = useAppSelector((state) => state.ui.theme)
  const locale = useAppSelector((state) => state.ui.locale)

  // 3D Tilt State
  const [tilt, setTilt] = useState({ x: 0, y: 0, isHovered: false })
  const imageRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Calculate rotation: Max 8 degrees.
    const rotateX = ((y - centerY) / centerY) * -8
    const rotateY = ((x - centerX) / centerX) * 8
    
    setTilt({ x: rotateX, y: rotateY, isHovered: true })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, isHovered: false })
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const cycleLocale = () => {
    const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]
    dispatch(setLocale(next))
    void i18n.changeLanguage(next)
  }

  const handleToggleTheme = () => {
    dispatch(toggleTheme())
  }

  return (
    <div className={`landing-page ${theme === 'light' ? 'theme-light' : ''}`}>
      <div className="landing-content">

        {/* ── Navbar ── */}
        <nav className="landing-nav">
          <Logo />
          
          <div className="landing-nav-center"></div>

          <div className="landing-nav-actions">
            <button className="landing-nav-icon-btn" onClick={handleToggleTheme} title="Toggle Theme">
              {theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
            
            <button className="landing-nav-icon-btn" onClick={cycleLocale} title="Change Language">
              <Globe className="size-4 mr-1.5" />
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{locale.toUpperCase()}</span>
            </button>

            <Link to="/login" className="landing-nav-link">
              Log in
            </Link>
            <Link to="/register" className="landing-login-btn">
              Sign up
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <main className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-pill">
              <Sparkles className="size-3 text-blue-400" />
              <span className="landing-pill-text">{t('landing.pill')}</span>
            </div>

            <h1 className="landing-title">
              {t('landing.title1')} <span className="landing-title-highlight">{t('landing.title2')}</span>
            </h1>

            <p className="landing-subtitle">
              {t('landing.subtitle')}
            </p>

            <div className="landing-actions">
              <Link to="/register" className="landing-primary-btn">
                {t('landing.ctaPrimary')} <ArrowRight className="size-4" />
              </Link>
              <Link to="/login" className="landing-secondary-btn">
                View Documentation
              </Link>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div 
              className={`landing-hero-image-wrapper ${tilt.isHovered ? 'hovered' : ''}`}
              ref={imageRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1200px) rotateX(${tilt.isHovered ? tilt.x : 5}deg) rotateY(${tilt.y}deg) scale(${tilt.isHovered ? 1.02 : 0.98})`,
                transition: tilt.isHovered ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <div className="landing-hero-glow-bg multi-color-glow" />
              <div className="landing-hero-image-container">
                <img src="https://png.pngtree.com/thumb_back/fw800/background/20250116/pngtree-digital-weather-display-technology-meteorology-image_16919924.jpg" alt="Nexus PM Dashboard" className="landing-hero-img" />
              </div>
            </div>
          </div>
        </main>

        {/* ── New Stats Section ── */}
        <section className="landing-new-stats">
          <div className="new-stat-item">
            <div className="new-stat-value">10K+</div>
            <div className="new-stat-title">Истифодабарандагони фаъол</div>
            <div className="new-stat-desc">ҳаррӯза қарзҳоро идора мекунанд</div>
          </div>
          <div className="new-stat-divider"></div>
          <div className="new-stat-item">
            <div className="new-stat-value">50K+</div>
            <div className="new-stat-title">Қарзҳои пайгиришуда</div>
            <div className="new-stat-desc">дар тамоми ҳисобҳо</div>
          </div>
          <div className="new-stat-divider"></div>
          <div className="new-stat-item">
            <div className="new-stat-value">99.9%</div>
            <div className="new-stat-title">Дастрасӣ</div>
            <div className="new-stat-desc">боэътимод ва ҳамеша дар тамос</div>
          </div>
          <div className="new-stat-divider"></div>
          <div className="new-stat-item">
            <div className="new-stat-value">3</div>
            <div className="new-stat-title">Забонҳо</div>
            <div className="new-stat-desc">EN · RU · TG</div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="landing-how-it-works">
          <p className="hiw-subtitle">ЧИ ТАВР КОР МЕКУНАД</p>
          <h2 className="hiw-title">
            Оғоз кунед бо <span className="hiw-title-dim">чор қадами оддӣ</span>
          </h2>
          
          <div className="hiw-steps-container">
            <div className="hiw-step-card">
              <div className="hiw-step-header">
                <span className="hiw-step-number">01</span>
                <div className="hiw-step-icon"><UserPlus className="size-5" /></div>
              </div>
              <h3 className="hiw-step-title">Аккаунт созед</h3>
              <p className="hiw-step-desc">Дар сонияҳо ба қайд гиред. Корти бонкӣ лозим нест. Маълумот бо имконияти ҳамоҳангсозии абрӣ дар дастгоҳ мемонад.</p>
            </div>

            <div className="hiw-step-card">
              <div className="hiw-step-header">
                <span className="hiw-step-number">02</span>
                <div className="hiw-step-icon"><FileText className="size-5" /></div>
              </div>
              <h3 className="hiw-step-title">Қарзҳоро илова кунед</h3>
              <p className="hiw-step-desc">Қарзҳоро бо тамосҳо, маблағҳо, санаҳо ва қайдҳо сабт кунед. Барои осонӣ онҳоро дар ҷузвдонҳо ташкил кунед.</p>
            </div>

            <div className="hiw-step-card">
              <div className="hiw-step-header">
                <span className="hiw-step-number">03</span>
                <div className="hiw-step-icon"><LineChart className="size-5" /></div>
              </div>
              <h3 className="hiw-step-title">Пешрафтро пайгирӣ кунед</h3>
              <p className="hiw-step-desc">Пардохтҳоро назорат кунед, таҳлилҳоро бинед ва дар бораи муносибатҳои молиявии худ маълумот гиред.</p>
            </div>

            <div className="hiw-step-card">
              <div className="hiw-step-header">
                <span className="hiw-step-number">04</span>
                <div className="hiw-step-icon"><CheckCircle className="size-5" /></div>
              </div>
              <h3 className="hiw-step-title">Муташаккил бошед</h3>
              <p className="hiw-step-desc">Қарзҳоро ҳамчун пардохтшуда қайд кунед, ҳисоботҳоро содир кунед ва ҳисоби дақиқи амалиётҳоро пеш баред.</p>
            </div>
          </div>
        </section>

        {/* ── Bento Grid Features ── */}
        <section className="landing-bento-section">
          <h2 className="landing-section-title">Engineered for Absolute Velocity</h2>
          <p className="landing-section-subtitle">
            A software revolution in performance and design. Where you can focus on shipping.
          </p>

          <div className="landing-bento-grid">

            {/* Row 1: Wide + Small */}
            <div className="landing-bento-card wide-card bento-gradient-1">
              <div className="bento-illustration gear-illustration">
                <div className="gear-circle"></div>
                <Globe className="gear-globe" />
              </div>
              <div className="bento-content-right">
                <div className="bento-icon-wrapper"><Layers className="size-5" /></div>
                <h3>Hyper-aware states</h3>
                <p>Automate work across your ecosystem with continuous awareness.</p>
              </div>
            </div>

            <div className="landing-bento-card small-card">
              <div className="bento-icon-wrapper"><Cpu className="size-5" /></div>
              <h3>Neural Scale Translation</h3>
              <p>Execute logic with natively compiled rust pipelines. Unprecedented speeds.</p>
            </div>

        

            {/* Row 3: 1 Full */}
            <div className="landing-bento-card full-card bento-gradient-3">
              <div className="bento-content-left">
                <div className="bento-icon-wrapper"><LayoutTemplate className="size-5" /></div>
                <h3>Custom Workspaces</h3>
                <p>Tailor the UI to your team's exact workflow. Infinite flexibility, zero clutter.</p>
              </div>
              <div className="bento-illustration ui-illustration">
                <div className="ui-panel"></div>
                <div className="ui-panel panel-offset"></div>
                <div className="ui-panel panel-offset-2"></div>
              </div>
            </div>

            {/* Row 4: Small + Wide */}
            <div className="landing-bento-card small-card">
              <div className="bento-icon-wrapper"><Code2 className="size-5" /></div>
              <h3>Infinite Syntax</h3>
              <p>Type seamlessly into our custom syntax engine. Unmatched keyboard-first usage.</p>
            </div>

            <div className="landing-bento-card wide-card bento-gradient-2">
              <div className="bento-illustration graph-illustration">
                <div className="node n1">You</div>
                <div className="node n2">App</div>
                <div className="node n3">DB</div>
                <svg className="graph-lines" viewBox="0 0 100 100">
                  <line x1="20" y1="20" x2="80" y2="20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="20" y1="20" x2="50" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="80" y1="20" x2="50" y2="80" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
              </div>
              <div className="bento-content-right">
                <div className="bento-icon-wrapper"><Network className="size-5" /></div>
                <h3>Quantum Collaboration</h3>
                <p>Real-time updates across globally distributed nodes. No lag.</p>
              </div>
            </div>

          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="landing-bottom-cta">
          <Link to="/login" className="bottom-cta-animated-icon">
            <div className="pulse-ring"></div>
            <Sparkles className="size-6 text-blue-400 relative z-10" />
          </Link>
          <h2 className="bottom-cta-title">Initialize Your Next Evolution</h2>
          <p className="bottom-cta-subtitle">
            Join the fastest growing open-source project management tool.
          </p>
          <div className="bottom-cta-actions">
            <Link to="/register" className="landing-primary-btn">
              Start building <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="landing-complex-footer">
          <div className="footer-brand">
            <Logo size={28} />
            <p className="footer-tagline">Designed for the future of work.</p>
          </div>
          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Product</h4>
              <Link to="/">Features</Link>
              <Link to="/">Integrations</Link>
              <Link to="/">Pricing</Link>
              <Link to="/">Changelog</Link>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <Link to="/">Documentation</Link>
              <Link to="/">API Reference</Link>
              <Link to="/">Blog</Link>
              <Link to="/">Community</Link>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <Link to="/">About</Link>
              <Link to="/">Careers</Link>
              <Link to="/">Contact</Link>
              <Link to="/">Privacy Policy</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
