import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { useUserStore } from '@/stores/userStore';
import { api } from '@/services/api';
import { LoginResponse } from '@/types/auth';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

const TOKEN_KEY = 'user_auth_token';
const REFRESH_TOKEN_KEY = 'user_refresh_token';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
                if (storedToken) {
                    setToken(storedToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                }
            } catch (error) {
                console.error('Error loading token:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadToken();    
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post<LoginResponse>('/auth/login', { email, password });
            if (response.data.token) {
                const { token } = response.data;
                await SecureStore.setItemAsync(TOKEN_KEY, token);
                await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                await useUserStore.getState().fetchCurrentUser();
                setToken(token);
            } else {
                Toast.show({
                    type: "error",
                    text1: "Erreur de connexion",
                    text2: 'Réponse invalide du serveur.',
                });
            }
        } catch (error: any) {
            console.error('Error logging in:', error);
            let errorMessage = 'Une erreur de réseau est survenue.';
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Error data:', error.response.data);
                console.error('Error status:', error.response.status);
                errorMessage = error.response.data?.message || `Erreur ${error.response.status}`;
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Error request:', error.request);
                errorMessage = 'Le serveur ne répond pas. Veuillez vérifier votre connexion.';
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', error.message);
                errorMessage = error.message;
            }
            Toast.show({
                type: "error",
                text1: 'Erreur de connexion',
                text2: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            delete api.defaults.headers.common['Authorization'];
            setToken(null);
            useTrackedBooksStore.getState().clearTrackedBooks();
            useUserStore.getState().logout();
        } catch (error) {
            console.error('Error deleting token:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, logout }}>
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