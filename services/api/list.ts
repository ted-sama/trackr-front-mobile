import { List, ListResponse } from "@/types";
import { api } from "./index";

export const createList = async (name: string): Promise<List> => {
  const response = await api.post('/lists', { name });
  return response.data.list;
};

export const updateList = async (listId: number, params: Partial<List>): Promise<List> => {
  const response = await api.patch(`/lists/${listId}`, params);
  return response.data.list;
};

export const addBookToList = async (listId: number, bookId: number): Promise<void> => {
  await api.post(`/lists/${listId}/books`, { id: bookId });
};

export const removeBookFromList = async (listId: number, bookId: number): Promise<void> => {
  await api.delete(`/lists/${listId}/books`, {
    data: { id: bookId },
  });
};

export const getMyLists = async (): Promise<ListResponse> => {
  const response = await api.get('/me/lists');
  return response.data;
};

export const getLists = async (): Promise<ListResponse> => {
  const response = await api.get('/lists');
  return response.data;
};

export const reorderBookInList = async (
  listId: number, 
  bookId: number, 
  newPosition: number
): Promise<void> => {
  await api.patch(`/lists/${listId}/reorder`, {
    bookId,
    newPosition,
  });
};

export const reorderBooksInListBulk = async (
  listId: number, 
  bookOrders: { bookId: number; position: number }[]
): Promise<void> => {
  await api.patch(`/lists/${listId}/reorder-bulk`, {
    bookOrders,
  });
};

