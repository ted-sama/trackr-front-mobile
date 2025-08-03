import { BookTracking } from "./reading-status";

/**
 * Interface représentant un manga
 */
export interface Book {
  id: string; // Changed from number to string to match API
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
  descriptionFr?: string;
  genres?: string[];
  tags?: string[];
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  itemNumber?: number;
  alternativeTitles?: string[];
  dataSource?: string;
  externalId?: string;
  nsfw?: boolean;
}

/**
 * Interface for books with tracking metadata used in stores
 */
export interface TrackedBookWithMeta extends Book {
  tracking: boolean;
  trackingStatus?: BookTracking;
} 