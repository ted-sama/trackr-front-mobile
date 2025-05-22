import { List } from "@/types";
import { api } from "./index";
import * as SecureStore from 'expo-secure-store';

export const createList = async (name: string): Promise<List> => {
  const token = await SecureStore.getItemAsync('user_auth_token');
  const response = await api.post('/lists', { name }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.list;
};

export const addBookToList = async (listId: number, bookId: number): Promise<void> => {
  const token = await SecureStore.getItemAsync('user_auth_token');
  await api.post(`/lists/${listId}/books`, { id: bookId }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
};

export const getMyLists = async () => {
  const response = await api.get('/lists');
  return response.data;
};

