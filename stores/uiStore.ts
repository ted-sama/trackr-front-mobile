import { create } from 'zustand';

export interface UIState {
  myLibraryLayout: 'grid' | 'list';
  listLayout: 'grid' | 'list';
  setMyLibraryLayout: (layout: 'grid' | 'list') => void;
  setListLayout: (layout: 'grid' | 'list') => void;
}

export const useUIStore = create<UIState>((set) => ({
  myLibraryLayout: 'list',
  listLayout: 'list',
  setMyLibraryLayout: (layout) => set({ myLibraryLayout: layout }),
  setListLayout: (layout) => set({ listLayout: layout }),
})); 