import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Book } from '@/types/book';
import type { BookActionsBottomSheetProps } from '@/components/BookActionsBottomSheet';

// Type definition for the bottom sheet context
interface BottomSheetContextType {
  isBottomSheetVisible: boolean;
  selectedBook: Book | null;
  view: BookActionsBottomSheetProps['view'];
  currentListId?: string;
  isFromListPage?: boolean;
  openBookActions: (book: Book, view?: BookActionsBottomSheetProps['view'], currentListId?: string, isFromListPage?: boolean) => void;
  closeBookActions: () => void;
}

// Create context with default values
const BottomSheetContext = createContext<BottomSheetContextType>({
  isBottomSheetVisible: false,
  selectedBook: null,
  view: 'actions',
  currentListId: undefined,
  isFromListPage: false,
  openBookActions: () => {},
  closeBookActions: () => {},
});

// Props for the provider component
type BottomSheetProviderProps = {
  children: ReactNode;
};

// Provider component to wrap the app
export const BottomSheetProvider = ({ children }: BottomSheetProviderProps) => {
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [view, setView] = useState<BookActionsBottomSheetProps['view']>('actions');
  const [currentListIdForSheet, setCurrentListIdForSheet] = useState<string | undefined>(undefined);
  const [isFromListPageForSheet, setIsFromListPageForSheet] = useState<boolean>(false);

  const openBookActions = (book: Book, viewArg?: BookActionsBottomSheetProps['view'], listId?: string, fromList?: boolean) => {
    setSelectedBook(book);
    setView(viewArg ?? 'actions');
    setCurrentListIdForSheet(listId);
    setIsFromListPageForSheet(fromList || false);
    setIsBottomSheetVisible(true);
  };

  const closeBookActions = () => {
    setIsBottomSheetVisible(false);
  };

  return (
    <BottomSheetContext.Provider value={{
      isBottomSheetVisible,
      selectedBook,
      view,
      currentListId: currentListIdForSheet,
      isFromListPage: isFromListPageForSheet,
      openBookActions,
      closeBookActions,
    }}>
      {children}
    </BottomSheetContext.Provider>
  );
};

// Custom hook to use the bottom sheet context
export const useBottomSheet = () => useContext(BottomSheetContext);
