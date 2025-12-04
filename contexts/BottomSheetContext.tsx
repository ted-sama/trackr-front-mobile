import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Book } from '@/types/book';

// Define sheet types
type SheetType = 'actions' | 'status_editor' | 'rating_editor' | 'list_editor' | 'list_creator';

// Type definition for the bottom sheet context
interface BottomSheetContextType {
  isBottomSheetVisible: boolean;
  selectedBook: Book | null;
  sheetType: SheetType;
  currentListId?: string;
  isFromListPage?: boolean;
  openBookActions: (book: Book, currentListId?: string, isFromListPage?: boolean) => void;
  openStatusEditor: (book: Book) => void;
  openRatingEditor: (book: Book) => void;
  openListEditor: (book: Book) => void;
  openListCreator: (book: Book) => void;
  closeBottomSheet: () => void;
}

// Create context with default values
const BottomSheetContext = createContext<BottomSheetContextType>({
  isBottomSheetVisible: false,
  selectedBook: null,
  sheetType: 'actions',
  currentListId: undefined,
  isFromListPage: false,
  openBookActions: () => {},
  openStatusEditor: () => {},
  openRatingEditor: () => {},
  openListEditor: () => {},
  openListCreator: () => {},
  closeBottomSheet: () => {},
});

// Props for the provider component
type BottomSheetProviderProps = {
  children: ReactNode;
};

// Provider component to wrap the app
export const BottomSheetProvider = ({ children }: BottomSheetProviderProps) => {
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [sheetType, setSheetType] = useState<SheetType>('actions');
  const [currentListIdForSheet, setCurrentListIdForSheet] = useState<string | undefined>(undefined);
  const [isFromListPageForSheet, setIsFromListPageForSheet] = useState<boolean>(false);

  const openBookActions = (book: Book, listId?: string, fromList?: boolean) => {
    setSelectedBook(book);
    setSheetType('actions');
    setCurrentListIdForSheet(listId);
    setIsFromListPageForSheet(fromList || false);
    setIsBottomSheetVisible(true);
  };

  const openStatusEditor = (book: Book) => {
    setSelectedBook(book);
    setSheetType('status_editor');
    setIsBottomSheetVisible(true);
  };

  const openRatingEditor = (book: Book) => {
    setSelectedBook(book);
    setSheetType('rating_editor');
    setIsBottomSheetVisible(true);
  };

  const openListEditor = (book: Book) => {
    setSelectedBook(book);
    setSheetType('list_editor');
    setIsBottomSheetVisible(true);
  };

  const openListCreator = (book: Book) => {
    setSelectedBook(book);
    setSheetType('list_creator');
    setIsBottomSheetVisible(true);
  };

  const closeBottomSheet = () => {
    setIsBottomSheetVisible(false);
  };

  return (
    <BottomSheetContext.Provider value={{
      isBottomSheetVisible,
      selectedBook,
      sheetType,
      currentListId: currentListIdForSheet,
      isFromListPage: isFromListPageForSheet,
      openBookActions,
      openStatusEditor,
      openRatingEditor,
      openListEditor,
      openListCreator,
      closeBottomSheet,
    }}>
      {children}
    </BottomSheetContext.Provider>
  );
};

// Custom hook to use the bottom sheet context
export const useBottomSheet = () => useContext(BottomSheetContext);
