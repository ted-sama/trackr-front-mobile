import { Book } from "./book";
import { User } from "./user";

export interface List {
  id: string;
  name: string;
  description?: string | null;
  backdropMode: "color" | "image";
  backdropColor: string;
  backdropImage?: string | null;
  tags?: string[] | null;
  owner: User;
  isPublic: boolean;
  ranked: boolean;
  books: {
    total: number;
    items: Book[];
  };
  likesCount: number;
  isLikedByMe: boolean;
  isSavedByMe: boolean;
  createdAt: Date;
  updatedAt: Date;
} 