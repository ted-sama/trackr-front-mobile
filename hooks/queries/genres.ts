import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { api } from '@/services/api';
import { queryKeys } from './keys';
import { queryClient, staleTimes } from '@/lib/queryClient';

export interface GenreTranslationsResponse {
  translations: Record<string, Record<string, string>>;
  languages: string[];
}

/**
 * Fetches genre translations from the API
 * This data is static and cached for a long time
 */
export function useGenreTranslations() {
  return useQuery({
    queryKey: queryKeys.genreTranslations,
    queryFn: async () => {
      const { data } = await api.get<GenreTranslationsResponse>('/genres/translations');
      return data;
    },
    staleTime: staleTimes.static,
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook that provides a function to translate a genre name
 * Uses the current language from i18next
 */
export function useTranslateGenre() {
  const { i18n } = useTranslation();
  const { data: genreData } = useGenreTranslations();

  const translateGenre = useCallback(
    (genre: string): string => {
      if (!genreData?.translations) return genre;

      const translations = genreData.translations[genre];
      if (!translations) return genre;

      // Get translation for current language, fallback to English, then original
      return translations[i18n.language] ?? translations['en'] ?? genre;
    },
    [genreData?.translations, i18n.language]
  );

  return translateGenre;
}

/**
 * Hook that translates an array of genres
 */
export function useTranslatedGenres(genres: string[] | null | undefined) {
  const translateGenre = useTranslateGenre();

  return useMemo(() => {
    if (!genres) return [];
    return genres.map((genre) => ({
      original: genre,
      translated: translateGenre(genre),
    }));
  }, [genres, translateGenre]);
}

/**
 * Prefetch genre translations on app startup
 * This ensures translations are available immediately when needed
 */
export function prefetchGenreTranslations() {
  queryClient.prefetchQuery({
    queryKey: queryKeys.genreTranslations,
    queryFn: async () => {
      const { data } = await api.get<GenreTranslationsResponse>('/genres/translations');
      return data;
    },
    staleTime: staleTimes.static,
  });
}
