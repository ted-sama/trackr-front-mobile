import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translationEn from '@/locales/en/translation.json';
import translationFr from '@/locales/fr/translation.json';

// Clé pour AsyncStorage
const LANGUAGE_STORAGE_KEY = '@MyApp:languagePreference';

const resources = {
    en: {
        translation: translationEn
    },
    fr: {
        translation: translationFr
    }
}

// Fonction pour charger la langue sauvegardée
const loadSavedLanguage = async () => {
    try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        return savedLanguage || 'en'; // Défaut: anglais
    } catch (error) {
        console.error('Failed to load language preference:', error);
        return 'en';
    }
};

// Initialisation de i18next
const initI18n = async () => {
    const savedLanguage = await loadSavedLanguage();
    
    i18next.use(initReactI18next).init({
        compatibilityJSON: 'v4',
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });
};

// Initialiser au démarrage
initI18n();

// Fonction pour sauvegarder la langue
export const saveLanguagePreference = async (language: string) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
        console.error('Failed to save language preference:', error);
    }
};

export default i18next;