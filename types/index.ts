/**
 * Types globaux pour l'application Trackr
 */

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

/**
 * Interface représentant un chapitre d'un manga
 */
export interface Chapter {
  id: number;
  volume?: number;
  published_at: Date;
  source_id: number;
  book_id: number;
  title: string;
  translation_language: string;
  chapter: string;
  external_url: string;
}

/**
 * Interface représentant une source de chapitre
 */
export interface Source {
  id: number;
  name: string;
  book_categories: string;
}

/**
 * Interface représentant une catégorie de mangas
 */
export interface Category {
  id: string;
  title: string;
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