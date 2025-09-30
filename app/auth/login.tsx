import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTypography } from "@/hooks/useTypography";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { TextField } from "@/components/ui/TextField";
import LinkButton from "@/components/ui/LinkButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { colors } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    login(email, password);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text>You are already logged in</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.h1, styles.title, { color: colors.text }]}>
        Connectez-vous à votre compte
      </Text>
      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Entrez votre email"
        />
        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="Entrez votre mot de passe"
          type="password"
        />
      </View>
      <LinkButton
        title="Mot de passe oublié ?"
        onPress={() => router.push("/auth/forgot-password")}
        style={styles.forgotPassword}
      />
      <Button
        title="Se connecter"
        disabled={email === "" || password === ""}
        onPress={handleLogin}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  input: {
    height: 50,
    width: "100%",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 16,
  },
  button: {
    marginTop: 32,
  },
});
