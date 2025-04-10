import React, { createContext, useContext, useRef } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

interface SearchAnimationContextType {
  searchBarHeight: SharedValue<number>;
  searchBarWidth: SharedValue<number>;
  searchBarY: SharedValue<number>;
  searchBarX: SharedValue<number>;
  searchBarRef: React.RefObject<any>;
  isSearchExpanded: SharedValue<number>;
}

const SearchAnimationContext = createContext<SearchAnimationContextType | null>(null);

export const SearchAnimationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Shared values for animation
  const searchBarHeight = useSharedValue(0);
  const searchBarWidth = useSharedValue(0);
  const searchBarY = useSharedValue(0);
  const searchBarX = useSharedValue(0);
  const isSearchExpanded = useSharedValue(0);
  
  // Ref pour mesurer la position du champ de recherche
  const searchBarRef = useRef(null);

  return (
    <SearchAnimationContext.Provider
      value={{
        searchBarHeight,
        searchBarWidth,
        searchBarY,
        searchBarX,
        searchBarRef,
        isSearchExpanded,
      }}
    >
      {children}
    </SearchAnimationContext.Provider>
  );
};

export const useSearchAnimation = () => {
  const context = useContext(SearchAnimationContext);
  if (!context) {
    throw new Error('useSearchAnimation must be used within a SearchAnimationProvider');
  }
  return context;
};
