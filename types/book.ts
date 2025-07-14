import { BookTracking } from "./reading-status";
import { Category } from "./category";

/**
 * Interface représentant un manga
 */
export interface Book {
  id: number;
  title: string;
  author?: string;
  rating?: number;
  ratingCount: number;
  releaseYear?: number;
  endYear?: number;
  volumes?: number;
  chapters?: number;
  coverImage?: string;
  type?: string;
  description?: string;
  genres?: string[];
  tags?: string[];
  status: string;
  tracking?: boolean;
  trackingStatus?: BookTracking | null;
  createdAt?: Date;
  updatedAt?: Date;
  itemNumber?: number;
} 