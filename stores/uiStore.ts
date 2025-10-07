import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UIState {
  myLibraryLayout: 'grid' | 'list';
  listLayout: 'grid' | 'list';
  categoryLayout: 'grid' | 'list';
  setMyLibraryLayout: (layout: 'grid' | 'list') => void;
  setListLayout: (layout: 'grid' | 'list') => void;
  setCategoryLayout: (layout: 'grid' | 'list') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      myLibraryLayout: 'list',
      listLayout: 'list',
      categoryLayout: 'list',
      setMyLibraryLayout: (layout) => set({ myLibraryLayout: layout }),
      setListLayout: (layout) => set({ listLayout: layout }),
      setCategoryLayout: (layout) => set({ categoryLayout: layout }),
    }),
    {
      name: '@MyApp:uiLayoutPreferences', // Clé dans AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 