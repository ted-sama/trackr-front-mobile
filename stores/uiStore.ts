import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type BookType = 'comic' | 'light_novel' | 'manga' | 'manhua' | 'manhwa' | 'novel';

export const ALL_BOOK_TYPES: BookType[] = ['comic', 'light_novel', 'manga', 'manhua', 'manhwa', 'novel'];

export interface UIState {
  myLibraryLayout: 'grid' | 'list';
  listLayout: 'grid' | 'list';
  categoryLayout: 'grid' | 'list';
  searchTypes: BookType[];
  setMyLibraryLayout: (layout: 'grid' | 'list') => void;
  setListLayout: (layout: 'grid' | 'list') => void;
  setCategoryLayout: (layout: 'grid' | 'list') => void;
  toggleSearchType: (type: BookType) => void;
  setSearchTypes: (types: BookType[]) => void;
  resetSearchTypes: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      myLibraryLayout: 'list',
      listLayout: 'list',
      categoryLayout: 'list',
      searchTypes: [...ALL_BOOK_TYPES], // All types enabled by default
      setMyLibraryLayout: (layout) => set({ myLibraryLayout: layout }),
      setListLayout: (layout) => set({ listLayout: layout }),
      setCategoryLayout: (layout) => set({ categoryLayout: layout }),
      toggleSearchType: (type) => {
        const currentTypes = get().searchTypes;
        if (currentTypes.includes(type)) {
          // Don't allow disabling all types - keep at least one
          if (currentTypes.length > 1) {
            set({ searchTypes: currentTypes.filter((t) => t !== type) });
          }
        } else {
          set({ searchTypes: [...currentTypes, type] });
        }
      },
      setSearchTypes: (types) => set({ searchTypes: types.length > 0 ? types : [...ALL_BOOK_TYPES] }),
      resetSearchTypes: () => set({ searchTypes: [...ALL_BOOK_TYPES] }),
    }),
    {
      name: '@MyApp:uiLayoutPreferences', // Clé dans AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 