import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEn from '@/locales/en/translation.json';
import translationFr from '@/locales/fr/translation.json';

const resources = {
    en: {
        translation: translationEn
    },
    fr: {
        translation: translationFr
    }
}

i18next.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    }
})

export default i18next;