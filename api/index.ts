import axios, { AxiosInstance } from 'axios';
import { Book, ChapterResponse, Chapter, Source, BookResponse, SourceResponse, CategoryResponse } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: 'https://9ea2-89-221-127-193.ngrok-free.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface searchParams {
    query: string;
    limit: number;
    offset: number;
}

interface getBookParams {
    id: string;
}

export const search = async (params: searchParams): Promise<Book[]> => {
  const response = await api.get(`/search?q=${params.query}&types=books&offset=${params.offset}&limit=${params.limit}`);
  return response.data.books;
};

export const getBook = async (params: getBookParams): Promise<Book> => {
  const response = await api.get(`/books/${params.id}`);
  return response.data;
};

export const getBooks = async (): Promise<BookResponse> => {
  const response = await api.get('/books');
  return response.data;
};

export const getChaptersFromBook = async (bookId: string): Promise<ChapterResponse> => {
  const response = await api.get(`/chapters/${bookId}`);
  return response.data;
};

export const getSources = async (): Promise<SourceResponse> => {
  const response = await api.get('/sources');
  return response.data;
};

export const getChaptersFromSource = async (
  bookId: string,
  sourceId: string,
  order: 'asc' | 'desc',
  offset: number = 0,
  limit: number = 20
): Promise<ChapterResponse> => {
  const params = new URLSearchParams({
    source: sourceId,
    order,
    offset: offset.toString(),
    limit: limit.toString(),
  });
  const response = await api.get(`/books/${bookId}/chapters?${params.toString()}`);
  return response.data;
};
