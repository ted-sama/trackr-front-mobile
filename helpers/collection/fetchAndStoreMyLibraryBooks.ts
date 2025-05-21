import { getMyLibraryBooks } from '@/api';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { Book } from '@/types';

export async function fetchAndStoreMyLibraryBooks() {
  try {
    const response = await getMyLibraryBooks({ offset: 0, limit: 1000 });
    const addTrackedBook = useTrackedBooksStore.getState().addTrackedBook;
    response.items.forEach((book: Book) => {
      addTrackedBook({ ...book, tracking: true, tracking_status: book.tracking_status });
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Erreur de chargement de la bibliothèque' };
  }
} 