import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
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

export default function Signup() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const { isLoading, isAuthenticated, register } = useAuth();

  // Validation functions
  const validateUsername = () => {
    if (!username.trim()) {
      return t("auth.errors.requiredField");
    }
    if (username.trim().length < 3) {
      return t("auth.errors.usernameTooShort");
    }
    if (username.trim().length > 30) {
      return t("auth.errors.usernameTooLong");
    }
    if (username.trim().includes(" ")) {
      return t("auth.errors.usernameContainsSpace");
    }
    return "";
  };

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
    if (password.length < 8) {
      return t("auth.errors.passwordTooShort");
    }
    return "";
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      return t("auth.errors.requiredField");
    }
    if (password !== confirmPassword) {
      return t("auth.errors.passwordMismatch");
    }
    return "";
  };

  const handleSignup = async () => {
    // Validation
    const usernameError = validateUsername();
    const emailError = validateEmail();
    const passwordError = validatePassword();
    const confirmPasswordError = validateConfirmPassword();

    // Update errors state
    setErrors({
      username: usernameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    if (usernameError || emailError || passwordError || confirmPasswordError) {
      toast.error(t("toast.errorCorrectionForm"));
      return;
    }

    register(email, password, username);
  };

  const isFormValid = () => {
    return (
      username.trim() !== "" &&
      email.trim() !== "" &&
      password !== "" &&
      confirmPassword !== "" &&
      password === confirmPassword
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
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
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.h1, styles.title, { color: colors.text }]}>
          {t("auth.signup.title")}
        </Text>
        <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
          {t("auth.signup.subtitle")}
        </Text>
        
        <View style={styles.form}>
          <TextField
            label={t("auth.signup.username")}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrors((prev) => ({ ...prev, username: "" }));
            }}
            placeholder={t("auth.signup.usernamePlaceholder")}
            error={errors.username}
          />
          <TextField
            label={t("auth.signup.email")}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder={t("auth.signup.emailPlaceholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <TextField
            label={t("auth.signup.password")}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder={t("auth.signup.passwordPlaceholder")}
            type="password"
            error={errors.password}
          />
          <TextField
            label={t("auth.signup.confirmPassword")}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            placeholder={t("auth.signup.confirmPasswordPlaceholder")}
            type="password"
            error={errors.confirmPassword}
          />
        </View>

        <Text style={[typography.body, styles.terms, { color: colors.secondaryText }]}>
          {t("auth.signup.terms")}{" "}
          <Text
            style={{ color: colors.accent, fontWeight: "600" }}
            onPress={() => {
              // TODO: Navigation vers les conditions d'utilisation
              toast(t("toast.comingSoon"));
            }}
          >
            {t("auth.signup.termsLink")}
          </Text>{" "}
          {t("auth.signup.and")}{" "}
          <Text
            style={{ color: colors.accent, fontWeight: "600" }}
            onPress={() => {
              // TODO: Navigation vers la politique de confidentialité
              toast(t("toast.comingSoon"));
            }}
          >
            {t("auth.signup.privacyLink")}
          </Text>
        </Text>

        <Button
          title={t("auth.signup.signupButton")}
          disabled={!isFormValid()}
          onPress={handleSignup}
          style={styles.button}
        />

        <View style={styles.loginContainer}>
          <Text style={[typography.body, { color: colors.secondaryText }]}>
            {t("auth.signup.hasAccount")}{" "}
          </Text>
          <LinkButton
            title={t("auth.signup.loginLink")}
            onPress={() => router.push("/auth/login")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 32,
    textAlign: "center",
    fontSize: 15,
  },
  form: {
    gap: 16,
    marginBottom: 16,
  },
  terms: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});

