import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Keyboard,
  TextInput,
} from "react-native";
import React, { useState, useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

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
  const { login, loginWithGoogle, isLoading, isAuthenticated } = useAuth();
  const scale = useSharedValue(1);
  const passwordRef = useRef<TextInput>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleGooglePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handleGooglePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
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
    <Pressable
      style={[styles.container, { backgroundColor: colors.background }]}
      onPress={Keyboard.dismiss}
    >
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
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label={t("auth.login.password")}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrors((prev) => ({ ...prev, password: "" }));
          }}
          placeholder={t("auth.login.passwordPlaceholder")}
          type="password"
          error={errors.password}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
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

      <View style={styles.dividerContainer}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[typography.caption, styles.dividerText, { color: colors.secondaryText }]}>
          {t("auth.login.orContinueWith")}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <AnimatedPressable
        onPress={loginWithGoogle}
        onPressIn={handleGooglePressIn}
        onPressOut={handleGooglePressOut}
        style={[
          styles.googleButton,
          animatedStyle,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <GoogleIcon size={20} />
        <Text style={[typography.button, styles.googleButtonText, { color: colors.text }]}>
          {t("auth.login.googleButton")}
        </Text>
      </AnimatedPressable>

      <View style={styles.signupContainer}>
        <Text style={[typography.body, { color: colors.secondaryText }]}>
          {t("auth.login.noAccount")}{" "}
        </Text>
        <LinkButton
          title={t("auth.login.createAccount")}
          onPress={() => router.push("/auth/signup")}
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
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  googleButtonText: {
    fontWeight: "600",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
