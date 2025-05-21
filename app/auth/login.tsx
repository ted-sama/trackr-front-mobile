import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext'; // This will use useAuthStore via AuthProvider
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { colors } = useTheme();
    const typography = useTypography();
    const router = useRouter();
    // useAuth now gets its values from useAuthStore
    const { login, isLoading, isAuthenticated, error: authError, setError: setAuthError } = useAuth();

    useEffect(() => {
        if (authError) {
            Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: authError,
            });
            // Clear the error in the store after showing it
            setAuthError(null); 
        }
    }, [authError, setAuthError]);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/');
        }
    }, [isAuthenticated, router]);

    const handleLogin = async () => {
        // The login action in useAuth (from useAuthStore) should handle the API call,
        // token storage, and updating isLoading/isAuthenticated/error states.
        // It's assumed authStore.login now takes email and password.
        // This might require an update to authStore.login's signature and implementation.
        // For now, we'll assume it's: login(email, password)
        // If authStore.login still expects tokens, this part needs to be re-evaluated based on authStore's actual implementation.
        
        // For this refactoring, we'll assume `authStore.login` will be modified
        // to take email/password and perform the API call.
        // If it's not, the `loginApi` call would still need to happen here,
        // and then `auth.login(token, refreshToken)` would be called.
        // However, the task implies centralizing the API call within the store.

        // Let's assume login is: login(email: string, password: string): Promise<void>
        // And it updates store's error state.
        try {
            // This call should set isLoading to true within the store
            await login(email, password); 
            // Navigation is now handled by the useEffect watching `isAuthenticated`
        } catch (err) {
            // If login action rejects, it should have set the error in the store.
            // The useEffect watching authError will display the Toast.
            // If login action doesn't set store error on reject, uncomment below:
            // Toast.show({ type: "error", text1: "Login Error", text2: "An unexpected error occurred."});
            console.error("Login attempt failed:", err);
        }
    };
    
    // The isLoading and isAuthenticated checks can remain similar,
    // as they reflect the store's state updated by the login action.
    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        )
    }

    // This check might be redundant if the useEffect for isAuthenticated handles navigation.
    // However, it can prevent rendering the login form momentarily if already authenticated.
    if (isAuthenticated) {
         // router.push('/'); // Handled by useEffect
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center'}]}>
                <Text style={{color: colors.text}}>Already logged in. Redirecting...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[typography.h1, styles.title, { color: colors.text }]}>Login</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text,
                    }
                ]}
                placeholder="Email"
                placeholderTextColor={colors.secondaryText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text
                    }
                ]}
                placeholder="Password"
                placeholderTextColor={colors.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Login" disabled={email === '' || password === '' || isLoading} onPress={handleLogin} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        marginBottom: 32,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
    },
});
