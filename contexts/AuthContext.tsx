import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../store/authStore'; // Adjusted path
import { User } from '../types/user'; // Assuming User type is here

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>; // Updated signature
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  getIsAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const {
    initializeAuth,
    token,
    refreshToken,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    setError,
    getIsAuthenticated,
  } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        user,
        isLoading,
        error,
        isAuthenticated,
        login,
        logout,
        setError,
        getIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};