/**
 * Types globaux pour l'application Trackr
 */

/**
 * Interface représentant un manga
 */
export interface Manga {
  id: string;
  title: string;
  coverImage: string;
  rating: number;
  genres: string[];
  releaseYear: number;
  // Champs additionnels qui pourraient être utiles à l'avenir
  author?: string;
  description?: string;
  status?: 'ongoing' | 'completed' | 'hiatus';
  volumes?: number;
  chapters?: number;
}

/**
 * Interface représentant une catégorie de mangas
 */
export interface Category {
  id: string;
  title: string;
  mangas: Manga[];
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
  mangas: Manga[];
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
export interface MangaTracking {
  userId: string;
  mangaId: string;
  status: ReadingStatus;
  currentChapter?: number;
  currentVolume?: number;
  rating?: number;
  startDate?: Date;
  finishDate?: Date;
  notes?: string;
} 