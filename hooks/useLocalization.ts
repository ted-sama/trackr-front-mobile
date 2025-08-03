import { useEffect, useState } from 'react';
import { getLocales } from 'expo-localization';

export function useLocalization() {
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    const locales = getLocales();
    const primaryLocale = locales[0]?.languageCode || 'en';
    setLocale(primaryLocale);
  }, []);

  const isFrench = locale === 'fr';

  return {
    locale,
    isFrench
  };
}