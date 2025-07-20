import { Book } from "./book";

export interface TrackedBook {
    userId: string;
    bookId: string;
    status: string;
    currentChapter: number | null;
    currentVolume: number | null;
    rating: number | null;
    startDate: string | null;
    finishDate: string | null;
    notes: string | null;
    lastReadAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    book: Book;
}
