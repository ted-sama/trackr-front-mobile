/**
 * Statut de lecture d'un manga
 */
export type ReadingStatus = 'plan_to_read' | 'reading' | 'completed' | 'on_hold' | 'dropped';

/**
 * Interface représentant le suivi de lecture d'un manga par un utilisateur
 */
export interface BookTracking {
  status: ReadingStatus;
  currentChapter?: number | null;
  currentVolume?: number | null;
  rating?: number | null;
  startDate?: Date | null;
  finishDate?: Date | null;
  notes?: string | null;
  lastReadAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
} 