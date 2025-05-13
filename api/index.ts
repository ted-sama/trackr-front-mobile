import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Book, ChapterResponse, Chapter, Source, BookResponse, SourceResponse, CategoryResponse, Category, BookTracking } from '@/types';
import { refreshToken } from './auth';

export const api: AxiosInstance = axios.create({
  baseURL: 'https://0711-89-221-127-193.ngrok-free.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable to prevent multiple refresh attempts simultaneously
let isRefreshing = false;
// Queue for requests that failed due to token expiry
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void; }> = [];

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

    // Check if error is 401 and not a an error from the refresh token endpoint itself
    if (error.response?.status === 401 && originalRequest && !originalRequest.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        // If token is already being refreshed, queue the original request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(async token => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
          }
          return axios(originalRequest); // Use axios instead of api to avoid infinite loop
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await refreshToken();
        if (refreshResponse.access_token && originalRequest.headers) {
          const newAccessToken = refreshResponse.access_token;
          api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;
          processQueue(null, newAccessToken);
          return axios(originalRequest); // Use axios instead of api to avoid infinite loop
        } else {
          // If refresh response does not contain access_token, treat as failure
          await SecureStore.deleteItemAsync('user_auth_token');
          await SecureStore.deleteItemAsync('user_refresh_token');
          processQueue(error, null);
          // Optionally, trigger a global logout event or redirect here
          // Example: EventEmitter.emit('logout');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // refreshToken already clears tokens in SecureStore on failure
        processQueue(refreshError as AxiosError, null);
        // Optionally, trigger a global logout event or redirect here
        // Example: EventEmitter.emit('logout');
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
}

interface getBookParams {
    id: string;
}

interface getMyLibraryBooksParams {
    offset: number;
    limit: number;
}

export const search = async (params: searchParams): Promise<Book[]> => {
  const response = await api.get(`/search?q=${params.query}&types=books&offset=${params.offset}&limit=${params.limit}`);
  return response.data.books;
};

export const getCategories = async (): Promise<CategoryResponse> => {
  const response = await api.get('/categories');
  return response.data;
};

export const getCategory = async (id: string): Promise<Category> => {
  const response = await api.get(`/categories/${id}`);
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
  const token = await SecureStore.getItemAsync('user_auth_token');
  const response = await api.get(`/me/books?offset=${params.offset}&limit=${params.limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const addBookToTracking = async (bookId: string): Promise<BookTracking> => {
  const token = await SecureStore.getItemAsync('user_auth_token');
  const response = await api.post(`/me/books`, {
    id: bookId,
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

export const removeBookFromTracking = async (bookId: string): Promise<void> => {
  const token = await SecureStore.getItemAsync('user_auth_token');
  const response = await api.delete(`/me/books`, {
    data: {
      id: bookId,
    },
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

export const checkIfBookIsTracked = async (bookId: string): Promise<BookTracking> => {
  const token = await SecureStore.getItemAsync('user_auth_token');
  const response = await api.get(`/me/books/contains/${bookId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });
  return response.data;
};
