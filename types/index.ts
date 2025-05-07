/**
 * Types globaux pour l'application Trackr
 */

export interface BookResponse {
  limit: number;
  offset: number;
  total: number;
  items: Book[];
}

/**
 * Interface représentant un manga
 */
export interface Book {
  id: number;
  title: string;
  author?: string;
  rating?: number;
  release_year?: number;
  end_year?: number;
  volumes?: number;
  chapters?: number;
  cover_image?: string;
  type?: string;
  description?: string;
  genres?: string[];
  tags?: string[];
  status: string;
  tracking?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface ChapterResponse {
  limit: number;
  offset: number;
  order: 'asc' | 'desc';
  total: number;
  items: Chapter[];
}

/**
 * Interface représentant un chapitre d'un manga
 */
export interface Chapter {
  id: number;
  volume?: number;
  published_at: string;
  source_id: number;
  book_id: number;
  title: string;
  translation_language: string;
  chapter: number;
  external_url: string;
}

export interface SourceResponse {
  limit: number;
  offset: number;
  total: number;
  items: Source[];
}

/**
 * Interface représentant une source de chapitre
 */
export interface Source {
  id: number;
  name: string;
  book_categories: string;
}

export interface CategoryResponse {
  limit: number;
  offset: number;
  total: number;
  items: Category[];
}

/**
 * Interface représentant une catégorie de mangas
 */
export interface Category {
  id: string;
  title: string;
  description: string;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  books: Book[];
}

/**
 * Interface représentant un utilisateur
 */
export interface User {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
}

/**
 * Interface représentant une liste de lecture
 */
export interface ReadingList {
  id: string;
  name: string;
  userId: string;
  books: Book[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Statut de lecture d'un manga
 */
export type ReadingStatus = 'plan_to_read' | 'reading' | 'completed' | 'on_hold' | 'dropped';

/**
 * Interface représentant le suivi de lecture d'un manga par un utilisateur
 */
export interface BookTracking {
  userId: string;
  bookId: string;
  status: ReadingStatus;
  currentChapter?: number;
  currentVolume?: number;
  rating?: number;
  startDate?: Date;
  finishDate?: Date;
  notes?: string;
} 