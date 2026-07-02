import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from '@/i18n/en/common.json'
import ru from '@/i18n/ru/common.json'
import tj from '@/i18n/tj/common.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ru: { common: ru },
      tj: { common: tj },
    },
    fallbackLng: import.meta.env.VITE_DEFAULT_LOCALE || 'ru',
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'locale',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
