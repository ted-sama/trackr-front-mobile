/**
 * Interface représentant un chapitre d'un manga
 */
export interface Chapter {
  id: number;
  volume?: number;
  publishedAt: string;
  sourceId: number;
  bookId: number;
  title: string;
  translationLanguage: string;
  chapter: number;
  externalUrl: string;
} 