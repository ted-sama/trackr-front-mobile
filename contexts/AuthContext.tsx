import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { useUserStore } from '@/stores/userStore';
import { api } from '@/services/api';
import { LoginResponse, RegisterResponse } from '@/types/auth';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { handleErrorCodes } from '@/utils/handleErrorCodes';
import { useTranslation } from 'react-i18next';
import { queryClient } from '@/lib/queryClient';

const TOKEN_KEY = 'user_auth_token';
const REFRESH_TOKEN_KEY = 'user_refresh_token';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (email: string,  password: string, username: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
    const { t } = useTranslation();

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

    const register = async (email: string, password: string, username: string) => {
        setIsLoading(true);
        try {
            const response = await api.post<RegisterResponse>('/auth/register', { email, password, username, displayName: username });
            toast(t("toast.registerSuccess"));
            router.push('/auth/email-flow');
        } catch (error: any) {
            toast.error(t(handleErrorCodes(error)));
        } finally {
            setIsLoading(false);
        }
    };

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
            }
        } catch (error: any) {
            toast.error(t(handleErrorCodes(error)));
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        try {
            const redirectUrl = 'trackr://auth/callback';
            const authUrl = `${api.defaults.baseURL}/auth/google/redirect?redirect_uri=${encodeURIComponent(redirectUrl)}`;

            const result = await WebBrowser.openAuthSessionAsync(authUrl, 'trackr');

            if (result.type === 'success' && result.url) {
                // Try to extract token from URL (query param or hash)
                const url = result.url;
                let token: string | null = null;

                // Check query params: ?token=xxx
                const queryMatch = url.match(/[?&]token=([^&]+)/);
                if (queryMatch) {
                    token = decodeURIComponent(queryMatch[1]);
                }

                // Check hash fragment: #token=xxx
                if (!token) {
                    const hashMatch = url.match(/#.*token=([^&]+)/);
                    if (hashMatch) {
                        token = decodeURIComponent(hashMatch[1]);
                    }
                }

                if (token) {
                    await SecureStore.setItemAsync(TOKEN_KEY, token);
                    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    await useUserStore.getState().fetchCurrentUser();
                    setToken(token);
                }
            }
        } catch (error: any) {
            toast.error(t(handleErrorCodes(error)));
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
            // Clear all stores
            useTrackedBooksStore.getState().clearTrackedBooks();
            useUserStore.getState().logout();
            // Clear all React Query cache (lists, books, categories, etc.)
            queryClient.clear();
        } catch (error) {
            console.error('Error deleting token:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, loginWithGoogle, register, logout }}>
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