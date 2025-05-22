import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Book } from '@/types';
import type { BookActionsBottomSheetProps } from '@/components/BookActionsBottomSheet';

// Type definition for the bottom sheet context
interface BottomSheetContextType {
  isBottomSheetVisible: boolean;
  selectedBook: Book | null;
  view: BookActionsBottomSheetProps['view'];
  openBookActions: (book: Book, view?: BookActionsBottomSheetProps['view']) => void;
  closeBookActions: () => void;
}

// Create context with default values
const BottomSheetContext = createContext<BottomSheetContextType>({
  isBottomSheetVisible: false,
  selectedBook: null,
  view: 'actions',
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

  const openBookActions = (book: Book, viewArg?: BookActionsBottomSheetProps['view']) => {
    setSelectedBook(book);
    setView(viewArg ?? 'actions');
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
      openBookActions,
      closeBookActions,
    }}>
      {children}
    </BottomSheetContext.Provider>
  );
};

// Custom hook to use the bottom sheet context
export const useBottomSheet = () => useContext(BottomSheetContext);
