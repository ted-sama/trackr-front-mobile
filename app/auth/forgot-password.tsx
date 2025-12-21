import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
} from "react-native";
import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { useTheme } from "@/contexts/ThemeContext";
import { useTypography } from "@/hooks/useTypography";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { TextField } from "@/components/ui/TextField";
import LinkButton from "@/components/ui/LinkButton";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { emailRegex } from "@/utils/regex";
import { useForgotPassword } from "@/hooks/queries/auth";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword();

  const validateEmail = () => {
    if (!email.trim()) {
      return t("auth.errors.requiredField");
    }
    if (!emailRegex.test(email)) {
      return t("auth.errors.invalidEmail");
    }
    return "";
  };

  const handleSubmit = async () => {
    const error = validateEmail();
    setEmailError(error);

    if (error) {
      return;
    }

    forgotPasswordMutation.mutate(email, {
      onSuccess: () => {
        setIsSubmitted(true);
      },
      onError: () => {
        toast.error(t("auth.forgotPassword.errorSending"));
      },
    });
  };

  if (isSubmitted) {
    return (
      <Pressable
        style={[styles.container, { backgroundColor: colors.background }]}
        onPress={Keyboard.dismiss}
      >
        <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
        <Text style={[typography.h1, styles.title, { color: colors.text }]}>
          {t("auth.forgotPassword.checkEmail")}
        </Text>
        <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
          {t("auth.forgotPassword.emailSent", { email })}
        </Text>
        <Button
          title={t("auth.forgotPassword.backToLogin")}
          onPress={() => router.back()}
          style={styles.button}
        />
        <View style={styles.resendContainer}>
          <Text style={[typography.body, { color: colors.secondaryText }]}>
            {t("auth.forgotPassword.noEmail")}{" "}
          </Text>
          <LinkButton
            title={t("auth.forgotPassword.resend")}
            onPress={() => {
              setIsSubmitted(false);
              handleSubmit();
            }}
          />
        </View>
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
        {t("auth.forgotPassword.title")}
      </Text>
      <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
        {t("auth.forgotPassword.subtitle")}
      </Text>
      <View style={styles.form}>
        <TextField
          label={t("auth.login.email")}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError("");
          }}
          placeholder={t("auth.login.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailError}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      </View>
      <Button
        title={forgotPasswordMutation.isPending ? t("common.loading") : t("auth.forgotPassword.sendLink")}
        disabled={email === "" || forgotPasswordMutation.isPending}
        onPress={handleSubmit}
        style={styles.button}
      />
      <View style={styles.backContainer}>
        <LinkButton
          title={t("auth.forgotPassword.backToLogin")}
          onPress={() => router.back()}
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
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
});
