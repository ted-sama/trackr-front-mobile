import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { useUserStore } from '@/stores/userStore';
import { api, setupAuthInterceptor } from '@/services/api';
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
    const logoutRef = useRef<(() => Promise<void>) | null>(null);

    // Logout function that clears all auth state
    const performLogout = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
            delete api.defaults.headers.common['Authorization'];
            setToken(null);
            // Clear all stores
            useTrackedBooksStore.getState().clearTrackedBooks();
            useUserStore.getState().logout();
            // Clear all React Query cache
            queryClient.clear();
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }, []);

    // Keep logout ref updated for the interceptor
    useEffect(() => {
        logoutRef.current = performLogout;
    }, [performLogout]);

    // Setup 401 interceptor on mount
    useEffect(() => {
        const interceptorId = setupAuthInterceptor(() => {
            // Call logout when 401 is received
            if (logoutRef.current) {
                logoutRef.current();
            }
        });

        return () => {
            // Cleanup interceptor on unmount
            api.interceptors.response.eject(interceptorId);
        };
    }, []);

    useEffect(() => {
        const loadAndValidateToken = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
                if (storedToken) {
                    // Set token in API headers first
                    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

                    // Validate token by fetching current user
                    // The interceptor will handle 401 and refresh automatically
                    await useUserStore.getState().fetchCurrentUser();

                    // After successful fetch, get the current token from storage
                    // (it may have been refreshed by the interceptor)
                    const currentToken = await SecureStore.getItemAsync(TOKEN_KEY);
                    setToken(currentToken);
                }
            } catch (error: any) {
                // Only clear tokens if it's an auth error (401)
                // The interceptor already tried to refresh and failed
                console.error('Token validation failed:', error);
                if (error?.response?.status === 401) {
                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                    delete api.defaults.headers.common['Authorization'];
                    useUserStore.getState().logout();
                }
                // For other errors (network, server), keep the tokens
            } finally {
                setIsLoading(false);
            }
        };
        loadAndValidateToken();
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
            const { token, refreshToken } = response.data;

            if (token) {
                // Store both tokens
                await SecureStore.setItemAsync(TOKEN_KEY, token);
                if (refreshToken) {
                    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
                }
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Fetch user data and verify it succeeded
                await useUserStore.getState().fetchCurrentUser();
                const currentUser = useUserStore.getState().currentUser;

                if (!currentUser) {
                    // User fetch failed, clean up and throw error
                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                    delete api.defaults.headers.common['Authorization'];
                    throw new Error('Failed to fetch user data');
                }

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
                // Try to extract tokens from URL
                const url = result.url;
                let newToken: string | null = null;
                let newRefreshToken: string | null = null;

                // Check query params: ?token=xxx&refreshToken=yyy
                const tokenMatch = url.match(/[?&]token=([^&]+)/);
                if (tokenMatch) {
                    newToken = decodeURIComponent(tokenMatch[1]);
                }

                const refreshMatch = url.match(/[?&]refreshToken=([^&]+)/);
                if (refreshMatch) {
                    newRefreshToken = decodeURIComponent(refreshMatch[1]);
                }

                // Check hash fragment as fallback: #token=xxx
                if (!newToken) {
                    const hashMatch = url.match(/#.*token=([^&]+)/);
                    if (hashMatch) {
                        newToken = decodeURIComponent(hashMatch[1]);
                    }
                }

                if (newToken) {
                    // Set token in API headers first
                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

                    // Fetch user data to validate the token
                    await useUserStore.getState().fetchCurrentUser();
                    const currentUser = useUserStore.getState().currentUser;

                    if (!currentUser) {
                        // User fetch failed, clean up
                        delete api.defaults.headers.common['Authorization'];
                        toast.error(t('errors.loginFailed'));
                        return;
                    }

                    // Token is valid and user data loaded, persist tokens
                    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
                    if (newRefreshToken) {
                        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
                    }
                    setToken(newToken);
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
            // Try to revoke refresh token on server (ignore errors)
            try {
                await api.post('/auth/logout');
            } catch {
                // Server logout failed, but we still clear local state
            }
            await performLogout();
        } catch (error) {
            console.error('Error during logout:', error);
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