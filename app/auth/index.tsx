import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/ui/Button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTypography } from '@/hooks/useTypography';
import { MailIcon } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type OnboardingState = 'welcome' | 'auth_options';

const ANIMATION_DURATION = 400;
const FADE_DURATION = 250;

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

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithGoogle, isLoading, isAuthenticated } = useAuth();

  const [currentState, setCurrentState] = useState<OnboardingState>('welcome');

  // Animation shared values
  const logoTranslateY = useSharedValue(0);
  const sloganOpacity = useSharedValue(1);
  const sloganTranslateY = useSharedValue(0);
  const authTextOpacity = useSharedValue(0);
  const authTextTranslateY = useSharedValue(20);
  const continueButtonOpacity = useSharedValue(1);
  const continueButtonTranslateY = useSharedValue(0);
  const authButtonsOpacity = useSharedValue(0);
  const authButtonsTranslateY = useSharedValue(30);

  // Google button press animation
  const googleScale = useSharedValue(1);

  const animationConfig = {
    duration: ANIMATION_DURATION,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  };

  const fadeConfig = {
    duration: FADE_DURATION,
    easing: Easing.out(Easing.ease),
  };

  const transitionToAuthOptions = () => {
    // Move logo up
    logoTranslateY.value = withTiming(-80, animationConfig);

    // Fade out slogan
    sloganOpacity.value = withTiming(0, fadeConfig);
    sloganTranslateY.value = withTiming(-20, fadeConfig);

    // Fade in auth text
    authTextOpacity.value = withTiming(1, fadeConfig);
    authTextTranslateY.value = withTiming(0, animationConfig);

    // Fade out continue button
    continueButtonOpacity.value = withTiming(0, fadeConfig);
    continueButtonTranslateY.value = withTiming(-20, fadeConfig);

    // Fade in auth buttons
    authButtonsOpacity.value = withTiming(1, fadeConfig);
    authButtonsTranslateY.value = withTiming(0, animationConfig);

    setCurrentState('auth_options');
  };

  const handleContinueWithEmail = () => {
    router.push('/auth/email-flow');
  };

  const handleGooglePressIn = () => {
    googleScale.value = withTiming(0.95, { duration: 220 });
  };

  const handleGooglePressOut = () => {
    googleScale.value = withTiming(1, { duration: 100 });
  };

  // Animated styles
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const sloganStyle = useAnimatedStyle(() => ({
    opacity: sloganOpacity.value,
    transform: [{ translateY: sloganTranslateY.value }],
  }));

  const authTextStyle = useAnimatedStyle(() => ({
    opacity: authTextOpacity.value,
    transform: [{ translateY: authTextTranslateY.value }],
  }));

  const continueButtonStyle = useAnimatedStyle(() => ({
    opacity: continueButtonOpacity.value,
    transform: [{ translateY: continueButtonTranslateY.value }],
  }));

  const authButtonsStyle = useAnimatedStyle(() => ({
    opacity: authButtonsOpacity.value,
    transform: [{ translateY: authButtonsTranslateY.value }],
  }));

  const googleButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: googleScale.value }],
  }));

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
          {t('auth.login.alreadyLoggedIn')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

      {/* Logo Section */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image
          source={require('@/assets/images/trackr-logo.png')}
          contentFit="contain"
          style={styles.logo}
        />
      </Animated.View>

      {/* Text Section */}
      <View style={styles.textContainer}>
        {/* Welcome Slogan (visible in welcome state) */}
        <Animated.View style={[styles.textWrapper, sloganStyle]}>
          <Text style={[typography.onboardingSlogan, styles.title, { color: colors.text }]}>
            {t('auth.onboarding.slogan')}
          </Text> 
        </Animated.View>

        {/* Auth Options Text (visible in auth_options state) */}
        <Animated.View style={[styles.textWrapper, styles.authTextWrapper, authTextStyle]}>
          <Text style={[typography.onboardingSlogan, styles.title, { color: colors.text }]}>
            {t('auth.onboarding.chooseMethod')}
          </Text>
        </Animated.View>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonsContainer}>
        {/* Continue Button (visible in welcome state) */}
        <Animated.View
          pointerEvents={currentState === 'welcome' ? 'auto' : 'none'}
          style={[styles.buttonWrapper, continueButtonStyle]}
        >
          <Button
            title={t('auth.onboarding.continue')}
            onPress={transitionToAuthOptions}
            style={styles.button}
          />
        </Animated.View>

        {/* Auth Buttons (visible in auth_options state) */}
        <Animated.View
          pointerEvents={currentState === 'auth_options' ? 'auto' : 'none'}
          style={[styles.authButtonsWrapper, authButtonsStyle]}
        >
          <AnimatedPressable
            onPress={loginWithGoogle}
            onPressIn={handleGooglePressIn}
            onPressOut={handleGooglePressOut}
            style={[
              styles.googleButton,
              googleButtonStyle,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <GoogleIcon size={20} />
            <Text style={[typography.button, styles.googleButtonText, { color: colors.text }]}>
              {t('auth.onboarding.continueWithGoogle')}
            </Text>
          </AnimatedPressable>

          <Button
            icon={<MailIcon size={20} color="#fff" strokeWidth={3} />}
            title={t('auth.onboarding.continueWithEmail')}
            onPress={handleContinueWithEmail}
            style={styles.button}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 175,
    height: 175,
  },
  textContainer: {
    minHeight: 120,
    justifyContent: 'center',
    marginBottom: 24,
  },
  textWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  authTextWrapper: {
    // Position auth text in the same location
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  buttonsContainer: {
    minHeight: 140,
  },
  buttonWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  authButtonsWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 12,
  },
  button: {
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  googleButtonText: {
    fontWeight: '600',
  },
});
