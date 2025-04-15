import axios, { AxiosInstance } from 'axios';
import { Book } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: 'https://2d23-81-198-118-168.ngrok-free.app/api',
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
  const response = await api.get(`/search?q=${params.query}&offset=${params.offset}&limit=${params.limit}`);
  return response.data;
};

export const getBook = async (params: getBookParams): Promise<Book> => {
  const response = await api.get(`/books/${params.id}`);
  return response.data;
};

