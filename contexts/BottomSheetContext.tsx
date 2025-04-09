import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type definition for the bottom sheet context
type BottomSheetContextType = {
  isBottomSheetVisible: boolean;
  setBottomSheetVisible: (visible: boolean) => void;
};

// Create context with default values
const BottomSheetContext = createContext<BottomSheetContextType>({
  isBottomSheetVisible: false,
  setBottomSheetVisible: () => {},
});

// Props for the provider component
type BottomSheetProviderProps = {
  children: ReactNode;
};

// Provider component to wrap the app
export const BottomSheetProvider = ({ children }: BottomSheetProviderProps) => {
  const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);

  return (
    <BottomSheetContext.Provider value={{ isBottomSheetVisible, setBottomSheetVisible }}>
      {children}
    </BottomSheetContext.Provider>
  );
};

// Custom hook to use the bottom sheet context
export const useBottomSheet = () => useContext(BottomSheetContext);
