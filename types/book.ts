import { Author } from "./author";
import { Publisher } from "./publisher";
import { BookTracking } from "./reading-status";

/**
 * Interface représentant un manga
 */
export interface Book {
  id: string | number; // API returns number but can be converted to string for keys
  title: string;
  authors?: Author[];
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
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  publishers?: Publisher[];
  itemNumber?: number;
  alternativeTitles?: string[];
  dataSource?: string;
  externalId?: number;
  nsfw?: boolean;
}

/**
 * Interface for books with tracking metadata used in stores
 */
export interface TrackedBookWithMeta extends Book {
  tracking: boolean;
  trackingStatus?: BookTracking;
} 