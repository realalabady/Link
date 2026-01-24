import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ar from './locales/ar.json';

export const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

export const supportedLanguages = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Update document direction based on language
i18n.on('languageChanged', (lng) => {
  const language = supportedLanguages.find((l) => l.code === lng);
  const dir = language?.dir || 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

// Set initial direction
const currentLang = supportedLanguages.find((l) => l.code === i18n.language);
document.documentElement.dir = currentLang?.dir || 'rtl';
document.documentElement.lang = i18n.language || 'ar';

export default i18n;
