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
import { toast } from "sonner-native";
import { TextField } from "@/components/ui/TextField";
import LinkButton from "@/components/ui/LinkButton";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { emailRegex } from "@/utils/regex";

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();

  const validateEmail = () => {
    if (!email.trim()) {
      return t("auth.errors.requiredField");
    }
    if (!emailRegex.test(email)) {
      return t("auth.errors.invalidEmail");
    }
    return "";
  };

  const validatePassword = () => {
    if (!password) {
      return t("auth.errors.requiredField");
    }
    return "";
  };

  const handleLogin = async () => {
    const emailError = validateEmail();
    const passwordError = validatePassword();

    // Update errors state
    setErrors({
      email: emailError,
      password: passwordError,
    });

    if (emailError || passwordError) {
      toast.error(t("toast.errorCorrectionForm"));
      return;
    }

    login(email, password);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.text }]}>
          {t("auth.login.alreadyLoggedIn")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <Text style={[typography.h1, styles.title, { color: colors.text }]}>
        {t("auth.login.title")}
      </Text>
      <View style={styles.form}>
        <TextField
          label={t("auth.login.email")}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setErrors((prev) => ({ ...prev, email: "" }));
          }}
          placeholder={t("auth.login.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <TextField
          label={t("auth.login.password")}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors((prev) => ({ ...prev, password: "" }));
          }}
          placeholder={t("auth.login.passwordPlaceholder")}
          type="password"
          error={errors.password}
        />
      </View>
      <LinkButton
        title={t("auth.login.forgotPassword")}
        onPress={() => {
          // TODO: Créer la page forgot-password
          toast(t("toast.comingSoon"));
        }}
        style={styles.forgotPassword}
      />
      <Button
        title={t("auth.login.loginButton")}
        disabled={email === "" || password === ""}
        onPress={handleLogin}
        style={styles.button}
      />
      <View style={styles.signupContainer}>
        <Text style={[typography.body, { color: colors.secondaryText }]}>
          {t("auth.login.noAccount")}{" "}
        </Text>
        <LinkButton
          title={t("auth.login.createAccount")}
          onPress={() => router.push("/auth/signup")}
        />
      </View>
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
    marginBottom: 24,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
