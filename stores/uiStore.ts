import { create } from 'zustand';

export interface UIState {
  myLibraryLayout: 'grid' | 'list';
  setMyLibraryLayout: (layout: 'grid' | 'list') => void;
}

export const useUIStore = create<UIState>((set) => ({
  myLibraryLayout: 'list',
  setMyLibraryLayout: (layout) => set({ myLibraryLayout: layout }),
})); 