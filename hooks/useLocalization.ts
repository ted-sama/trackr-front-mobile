import { useEffect, useState } from 'react';
import { getLocales } from 'expo-localization';
import i18n from '@/i18n';

export function useLocalization() {
  const [locale, setLocale] = useState<string>(i18n.language || 'en');

  useEffect(() => {
    // Set initial locale from i18n
    setLocale(i18n.language || 'en');

    // Listen for language changes
    const handleLanguageChange = (lng: string) => {
      setLocale(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup listener on unmount
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const isFrench = locale === 'fr';

  return {
    locale,
    isFrench
  };
}