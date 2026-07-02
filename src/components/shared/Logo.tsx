import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  const gradientId = useId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Task Management"
    >
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M9.5 16.5L13.5 20.5L22.5 11"
        stroke="white"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Logo({ size = 32, showWordmark = true, className }: LogoProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        // Inherits color from the surrounding context instead of hardcoding it, so this
        // reads correctly both on always-dark surfaces (AuthPage) and theme-aware ones
        // (LandingPage, which supports light mode).
        <span className="text-lg font-bold tracking-tight">{t('app.name')}</span>
      )}
    </div>
  )
}
