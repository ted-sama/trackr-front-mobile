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
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { TextField } from "@/components/ui/TextField";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { useChangePassword } from "@/hooks/queries/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedHeader } from "@/components/shared/AnimatedHeader";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

export default function ChangePassword() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const changePasswordMutation = useChangePassword();
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const validateCurrentPassword = () => {
    if (!currentPassword) {
      return t("auth.errors.requiredField");
    }
    return "";
  };

  const validateNewPassword = () => {
    if (!newPassword) {
      return t("auth.errors.requiredField");
    }
    if (newPassword.length < 8) {
      return t("auth.errors.passwordTooShort");
    }
    return "";
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      return t("auth.errors.requiredField");
    }
    if (newPassword !== confirmPassword) {
      return t("auth.errors.passwordMismatch");
    }
    return "";
  };

  const handleSubmit = async () => {
    const currentPasswordError = validateCurrentPassword();
    const newPasswordError = validateNewPassword();
    const confirmPasswordError = validateConfirmPassword();

    setErrors({
      currentPassword: currentPasswordError,
      newPassword: newPasswordError,
      confirmPassword: confirmPasswordError,
    });

    if (currentPasswordError || newPasswordError || confirmPasswordError) {
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success(t("changePassword.success"));
          router.back();
        },
        onError: (error: any) => {
          const errorCode = error.response?.data?.error?.code;
          if (errorCode === "AUTH_INVALID_CURRENT_PASSWORD") {
            setErrors((prev) => ({
              ...prev,
              currentPassword: t("errors.AUTH_INVALID_CURRENT_PASSWORD"),
            }));
          } else if (errorCode === "AUTH_NO_PASSWORD") {
            toast.error(t("errors.AUTH_NO_PASSWORD"));
          } else {
            toast.error(t("changePassword.errorChanging"));
          }
        },
      }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t("changePassword.title")}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{
          marginTop: insets.top,
          paddingBottom: 64,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={Keyboard.dismiss}>
          <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
            <Text style={[typography.h1, { color: colors.text }]}>
              {t("changePassword.title")}
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label={t("changePassword.currentPassword")}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setErrors((prev) => ({ ...prev, currentPassword: "" }));
              }}
              placeholder={t("changePassword.currentPasswordPlaceholder")}
              type="password"
              error={errors.currentPassword}
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
            />
            <TextField
              ref={newPasswordRef}
              label={t("changePassword.newPassword")}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setErrors((prev) => ({ ...prev, newPassword: "" }));
              }}
              placeholder={t("changePassword.newPasswordPlaceholder")}
              type="password"
              error={errors.newPassword}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
            <TextField
              ref={confirmPasswordRef}
              label={t("changePassword.confirmPassword")}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              placeholder={t("changePassword.confirmPasswordPlaceholder")}
              type="password"
              error={errors.confirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </View>

          <Button
            title={changePasswordMutation.isPending ? t("common.loading") : t("changePassword.submit")}
            disabled={
              currentPassword === "" ||
              newPassword === "" ||
              confirmPassword === "" ||
              changePasswordMutation.isPending
            }
            onPress={handleSubmit}
            style={styles.button}
          />
        </Pressable>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 70,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  button: {
    marginTop: 32,
  },
});
