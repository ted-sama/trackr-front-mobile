/**
 * Statut de lecture d'un manga
 */
export type ReadingStatus = 'plan_to_read' | 'reading' | 'completed' | 'on_hold' | 'dropped';

/**
 * Interface représentant le suivi de lecture d'un manga par un utilisateur
 */
export interface BookTracking {
  status: ReadingStatus;
  currentChapter?: number;
  currentVolume?: number;
  rating?: number;
  startDate?: Date;
  finishDate?: Date;
  notes?: string;
  lastReadAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
} 