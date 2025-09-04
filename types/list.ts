import { Book } from "./book";
import { User } from "./user";

export interface List {
  id: string;
  name: string;
  description?: string | null;
  backdropImage?: string | null;
  backdropColor?: string | null;
  tags?: string[] | null;
  owner: User;
  isPublic: boolean;
  ranked: boolean;
  books: {
    total: number;
    items: Book[];
  };
  createdAt: Date;
  updatedAt: Date;
} 