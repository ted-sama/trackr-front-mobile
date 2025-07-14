import { Book } from "./book";
import { User } from "./user";

export interface List {
  id: number;
  name: string;
  description?: string | null;
  backdropImage?: string | null;
  tags?: string[] | null;
  owner: User;
  isPublic: boolean;
  ranked: boolean;
  firstBookCovers?: string[];
  totalBooks: number;
  books?: Book[];
  createdAt: Date;
  updatedAt: Date;
} 