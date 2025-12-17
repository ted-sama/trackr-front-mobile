import { User } from "./user";
import { Book } from "./book";

/**
 * Interface representing a book review
 */
export interface BookReview {
  id: number;
  userId: string;
  bookId: number;
  content: string;
  rating: number | null;
  likesCount: number;
  isLikedByMe: boolean;
  revisionsCount: number;
  isSpoiler: boolean;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "username" | "displayName" | "avatar" | "plan">;
  book?: Pick<Book, "id" | "title" | "coverImage">;
  revisions?: BookReviewRevision[];
}

/**
 * Interface for review revision history
 */
export interface BookReviewRevision {
  id: number;
  content: string;
  rating: number | null;
  createdAt: string;
}

/**
 * DTO for creating a new review
 */
export interface CreateReviewDTO {
  content: string;
  isSpoiler?: boolean;
}

/**
 * DTO for updating an existing review
 */
export interface UpdateReviewDTO {
  content: string;
  isSpoiler?: boolean;
}

/**
 * Filter options for reviews list
 */
export type ReviewSortOption = "recent" | "popular" | "highest_rated" | "lowest_rated";

