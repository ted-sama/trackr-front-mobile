import { Book } from "./book";

/**
 * Interface représentant une catégorie de mangas
 */
export interface Category {
  id: string;
  title: string;
  description: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  books: Book[];
} 