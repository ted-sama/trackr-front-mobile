import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { login } from '@/api/auth';
import { LoginResponse } from '@/types/auth';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { colors } = useTheme();
    const typography = useTypography();
    const router = useRouter();

    const handleLogin = async () => {
        const response: LoginResponse = await login({ email, password });
        console.log(response);
        if (response.token) {
            router.push('/');
        } else {
            Toast.show({
                type: "error",
                text1: response.message,
            });
        }
    };

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
            <Button title="Login" onPress={handleLogin} />
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
