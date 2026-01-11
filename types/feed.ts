import { Book } from "./book";

export interface RecentlyRatedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
}

export interface RecentlyRatedItem {
  book: Book;
  user: RecentlyRatedUser;
  rating: number;
  hasReview: boolean;
  reviewId: number | null;
  ratedAt: string;
}

export interface PopularAmongFollowingResponse {
  id: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  isFeatured: boolean;
  books: Book[];
}
