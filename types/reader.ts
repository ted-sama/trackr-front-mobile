import { User } from "./user";
import { ReadingStatus } from "./reading-status";

/**
 * User who has read a book (among the current user's following)
 */
export interface BookReaderUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  plan: "free" | "plus";
}

/**
 * A reader item representing a user who has read a specific book
 */
export interface BookReaderItem {
  user: BookReaderUser;
  status: ReadingStatus;
  rating: number | null;
  hasReview: boolean;
  reviewId: number | null;
  /** Current chapter (null if not visible due to privacy settings) */
  currentChapter: number | null;
  /** Current volume (null if not visible due to privacy settings) */
  currentVolume: number | null;
}

/**
 * Response from the book readers endpoint
 */
export interface BookReadersResponse {
  readers: BookReaderItem[];
  total: number;
}
