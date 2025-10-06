import { Book } from "./book";

/**
 * Interface représentant une catégorie de mangas
 */
export interface Category {
  id: string;
  title: string;
  titleFr: string;
  description: string;
  descriptionFr: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  books: Book[];
} 