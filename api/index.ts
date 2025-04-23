import axios, { AxiosInstance } from 'axios';
import { Book, ChapterResponse, Chapter, Source, BookResponse, SourceResponse, CategoryResponse } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: 'https://d23c-93-22-150-147.ngrok-free.app/api/v1',
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

export const search = async (params: searchParams): Promise<BookResponse> => {
  const response = await api.get(`/search?q=${params.query}&offset=${params.offset}&limit=${params.limit}`);
  return response.data;
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

export const getChaptersFromSource = async (bookId: string, sourceId: string): Promise<ChapterResponse> => {
  const response = await api.get(`/books/${bookId}/chapters?source=${sourceId}`);
  return response.data;
};
