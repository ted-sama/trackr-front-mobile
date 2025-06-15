import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Book, ChapterResponse, Chapter, Source, BookResponse, SourceResponse, CategoryResponse, Category, BookTracking, ReadingStatus, ListResponse, List, User } from '@/types';
import { refreshToken, clearAuthTokens } from './auth';

export const api: AxiosInstance = axios.create({
  baseURL: 'https://97paffp8zdj0.share.zrok.io/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize API with stored token
export const initializeAPI = async () => {
  try {
    const token = await SecureStore.getItemAsync('user_auth_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to initialize API with stored token:', error);
  }
};

// Variable to prevent multiple refresh attempts simultaneously
let isRefreshing = false;
// Queue for requests that failed due to token expiry
let failedQueue: { resolve: (value?: any) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Check if error is 401 and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      if (isRefreshing) {
        // If token is already being refreshed, queue the original request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(async token => {
          if (originalRequest.headers && token) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      // Mark this request as retried to prevent infinite loops
      (originalRequest as any)._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await refreshToken();
        if (refreshResponse.access_token) {
          const newAccessToken = refreshResponse.access_token;
          
          // Update the current request's authorization header
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          }
          
          // Process the queue with the new token
          processQueue(null, newAccessToken);
          
          // Retry the original request
          return api(originalRequest);
        } else {
          // If refresh response does not contain access_token, treat as failure
          await clearAuthTokens();
          processQueue(error, null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Clear tokens and process queue with error
        await clearAuthTokens();
        processQueue(refreshError as AxiosError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

interface searchParams {
    query: string;
    limit: number;
    offset: number;
    types?: ('books' | 'chapters' | 'lists')[];
}

interface SearchResponse {
  books: Book[];
  chapters: Chapter[];
  lists: List[];
  totalBooks: number;
  totalChapters: number;
  totalLists: number;
  limit: number;
  offset: number;
}

interface getBookParams {
    id: string;
}

interface getMyLibraryBooksParams {
    offset: number;
    limit: number;
}

export const search = async (params: searchParams): Promise<SearchResponse> => {
  const types = params.types || ['books'];
  const typesParam = types.join(',');
  const response = await api.get(`/search?q=${params.query}&types=${typesParam}&offset=${params.offset}&limit=${params.limit}`);
  return response.data;
};

export const getCategories = async (): Promise<CategoryResponse> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategory = async (id: string): Promise<Category> => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

export const getList = async (id: string): Promise<List> => {
  const response = await api.get(`/lists/${id}`);
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

export const getMyLibraryBooks = async (params: getMyLibraryBooksParams): Promise<BookResponse> => {
  const response = await api.get(`/me/books?offset=${params.offset}&limit=${params.limit}`);
  return response.data;
};

export const getMyLists = async (): Promise<ListResponse> => {
  const response = await api.get('/me/lists');
  return response.data;
};

export const addBookToTracking = async (bookId: string): Promise<BookTracking> => {
  const response = await api.post(`/me/books`, {
    id: bookId,
  });
  return response.data.book_tracking;
};

export const removeBookFromTracking = async (bookId: string): Promise<void> => {
  const response = await api.delete(`/me/books`, {
    data: {
      id: bookId,
    }
  });
  return response.data;
};

export const getMe = async (): Promise<{ user: User }> => {
  const response = await api.get('/me');
  return response.data;
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  const response = await api.patch('/me', userData);
  return response.data.user;
};

interface updateBookTrackingParams {
  bookId: string;
  status?: ReadingStatus;
  current_chapter?: number;
  current_volume?: number;
  rating?: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const updateBookTracking = async (params: updateBookTrackingParams): Promise<BookTracking> => {
  const response = await api.patch(`/me/books/${params.bookId}`, params);
  return response.data.book_tracking;
};

export const checkIfBookIsTracked = async (bookId: string): Promise<BookTracking> => {
  const response = await api.get(`/me/books/contains/${bookId}`);
  return response.data;
};

export const getRecap = async (bookId: string, chapter: number): Promise<string> => {
  const response = await api.get(`/books/${bookId}/recap/${chapter}`);
  return response.data;
};