const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

// Intl uses the ISO 639-1 code 'tg' for Tajik; our app locale key is 'tj' to match the TZ's RU/EN/TJ convention.
const INTL_LOCALE_MAP: Record<string, string> = { tj: 'tg' }

export function formatRelativeTime(isoDate: string, locale: string): string {
  const seconds = (Date.parse(isoDate) - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE_MAP[locale] ?? locale, { numeric: 'auto' })

  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return rtf.format(Math.round(seconds / secondsInUnit), unit)
    }
  }
  return rtf.format(Math.round(seconds), 'second')
}
