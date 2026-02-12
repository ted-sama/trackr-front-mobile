import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useTrackedBooksStore } from '@/stores/trackedBookStore';
import { useUserStore } from '@/stores/userStore';
import { api, setupAuthInterceptor } from '@/services/api';
import { LoginResponse, RegisterResponse } from '@/types/auth';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { handleErrorCodes, getErrorCode } from '@/utils/handleErrorCodes';
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
  processOAuthCallback: (accessToken: string, refreshToken?: string) => Promise<boolean>;
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
            router.push({ pathname: '/auth/email-flow', params: { email, action: 'verify' } });
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
            const errorCode = getErrorCode(error);
            if (errorCode === 'AUTH_EMAIL_NOT_VERIFIED') {
                toast.error(t('errors.AUTH_EMAIL_NOT_VERIFIED'));
                router.push({ pathname: '/auth/email-flow', params: { email, action: 'verify' } });
            } else {
                toast.error(t(handleErrorCodes(error)));
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Shared logic to process OAuth tokens (used by loginWithGoogle and auth/callback screen)
    const processOAuthCallback = useCallback(async (accessToken: string, oauthRefreshToken?: string): Promise<boolean> => {
        try {
            // Set token in API headers first
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Fetch user data to validate the token
            await useUserStore.getState().fetchCurrentUser();
            const currentUser = useUserStore.getState().currentUser;

            if (!currentUser) {
                // User fetch failed, clean up
                delete api.defaults.headers.common['Authorization'];
                return false;
            }

            // Token is valid and user data loaded, persist tokens
            await SecureStore.setItemAsync(TOKEN_KEY, accessToken);

            if (oauthRefreshToken) {
                await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, oauthRefreshToken);
                if (__DEV__) {
                    console.log('[Auth] Refresh token stored successfully');
                }
            } else {
                console.warn('[Auth] WARNING: No refresh token received from OAuth callback!');
            }

            setToken(accessToken);
            return true;
        } catch (error) {
            console.error('[Auth] Error processing OAuth callback:', error);
            delete api.defaults.headers.common['Authorization'];
            return false;
        }
    }, []);

    const loginWithGoogle = async () => {
        setIsLoading(true);
        try {
            const redirectUrl = 'trackr://auth/callback';
            const authUrl = `${api.defaults.baseURL}/auth/google/redirect?redirect_uri=${encodeURIComponent(redirectUrl)}`;

            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

            if (result.type === 'success' && result.url) {
                // Parse tokens from the callback URL
                const url = result.url;
                let newToken: string | null = null;
                let newRefreshToken: string | null = null;

                const queryStart = url.indexOf('?');
                const hashStart = url.indexOf('#');

                let queryString = '';
                if (queryStart !== -1) {
                    const endIndex = hashStart !== -1 && hashStart > queryStart ? hashStart : url.length;
                    queryString = url.substring(queryStart + 1, endIndex);
                }

                if (queryString) {
                    const params = new URLSearchParams(queryString);
                    newToken = params.get('token');
                    newRefreshToken = params.get('refreshToken');
                }

                if (!newToken && hashStart !== -1) {
                    const fragment = url.substring(hashStart + 1);
                    const fragmentParams = new URLSearchParams(fragment);
                    newToken = fragmentParams.get('token');
                    if (!newRefreshToken) {
                        newRefreshToken = fragmentParams.get('refreshToken');
                    }
                }

                if (__DEV__) {
                    console.log('[Auth] Google OAuth callback URL received');
                    console.log('[Auth] Token present:', !!newToken);
                    console.log('[Auth] Refresh token present:', !!newRefreshToken);
                }

                if (newToken) {
                    const success = await processOAuthCallback(newToken, newRefreshToken ?? undefined);
                    if (!success) {
                        toast.error(t('errors.loginFailed'));
                    }
                } else {
                    console.error('[Auth] No access token found in Google OAuth callback URL');
                    toast.error(t('errors.loginFailed'));
                }
            }
        } catch (error: any) {
            console.error('[Auth] Google OAuth error:', error);
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
            } catch (e) {
                // Server logout failed, but we still clear local state
                if (__DEV__) console.error('Server logout failed:', e);
            }
            await performLogout();
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ token, isAuthenticated: !!token, isLoading, login, loginWithGoogle, processOAuthCallback, register, logout }}>
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
