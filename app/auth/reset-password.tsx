import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
  TextInput,
} from "react-native";
import React, { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useRouter, useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { TextField } from "@/components/ui/TextField";
import LinkButton from "@/components/ui/LinkButton";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useResetPassword } from "@/hooks/queries/auth";

export default function ResetPassword() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const resetPasswordMutation = useResetPassword();
  const confirmPasswordRef = useRef<TextInput>(null);

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

  const handleSubmit = async () => {
    const passwordError = validatePassword();
    const confirmPasswordError = validateConfirmPassword();

    setErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    if (passwordError || confirmPasswordError) {
      return;
    }

    if (!token) {
      toast.error(t("auth.resetPassword.invalidToken"));
      return;
    }

    resetPasswordMutation.mutate(
      { token, password },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: (error: any) => {
          const errorCode = error.response?.data?.error?.code;
          if (errorCode === "RESET_TOKEN_EXPIRED" || errorCode === "RESET_TOKEN_INVALID") {
            toast.error(t("auth.resetPassword.tokenExpired"));
          } else {
            toast.error(t("auth.resetPassword.errorResetting"));
          }
        },
      }
    );
  };

  if (!token) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <Text style={[typography.h1, styles.title, { color: colors.text }]}>
          {t("auth.resetPassword.invalidLink")}
        </Text>
        <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
          {t("auth.resetPassword.invalidLinkSubtitle")}
        </Text>
        <Button
          title={t("auth.resetPassword.requestNewLink")}
          onPress={() => router.replace("/auth/forgot-password")}
          style={styles.button}
        />
      </View>
    );
  }

  if (isSuccess) {
    return (
      <Pressable
        style={[styles.container, { backgroundColor: colors.background }]}
        onPress={Keyboard.dismiss}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <Text style={[typography.h1, styles.title, { color: colors.text }]}>
          {t("auth.resetPassword.success")}
        </Text>
        <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
          {t("auth.resetPassword.successSubtitle")}
        </Text>
        <Button
          title={t("auth.resetPassword.goToLogin")}
          onPress={() => router.replace("/auth/email-flow")}
          style={styles.button}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={Keyboard.dismiss}
    >
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      <Text style={[typography.h1, styles.title, { color: colors.text }]}>
        {t("auth.resetPassword.title")}
      </Text>
      <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
        {t("auth.resetPassword.subtitle")}
      </Text>
      <View style={styles.form}>
        <TextField
          label={t("auth.resetPassword.newPassword")}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors((prev) => ({ ...prev, password: "" }));
          }}
          placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
          type="password"
          error={errors.password}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />
        <TextField
          ref={confirmPasswordRef}
          label={t("auth.resetPassword.confirmPassword")}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
          type="password"
          error={errors.confirmPassword}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>
      <Button
        title={resetPasswordMutation.isPending ? t("common.loading") : t("auth.resetPassword.resetButton")}
        disabled={password === "" || confirmPassword === "" || resetPasswordMutation.isPending}
        onPress={handleSubmit}
        style={styles.button}
      />
      <View style={styles.backContainer}>
        <LinkButton
          title={t("auth.forgotPassword.backToLogin")}
          onPress={() => router.replace("/auth/email-flow")}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  button: {
    marginTop: 32,
    marginBottom: 16,
  },
  backContainer: {
    alignItems: "center",
  },
});
