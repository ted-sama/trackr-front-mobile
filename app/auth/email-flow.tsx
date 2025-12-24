import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
  TextInput,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { toast } from 'sonner-native';

import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import LinkButton from '@/components/ui/LinkButton';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useCheckEmail } from '@/hooks/queries/auth';
import { useAuth } from '@/contexts/AuthContext';
import { emailRegex } from '@/utils/regex';
import { handleErrorCodes } from '@/utils/handleErrorCodes';

const ANIMATION_DURATION = 300;

type FlowType = 'login' | 'register' | null;
type Step = 'email' | 'password' | 'register';

interface StepConfig {
  key: Step;
  title: string;
  subtitle: string;
}

export default function EmailFlowScreen() {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, register, isLoading } = useAuth();

  // Flow state
  const [flowType, setFlowType] = useState<FlowType>(null);
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });

  const checkEmailMutation = useCheckEmail();

  // Refs for keyboard navigation
  const passwordRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  // Animation values
  const slideX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  // Get steps based on flow type
  const getSteps = (): StepConfig[] => {
    if (flowType === 'login') {
      return [
        { key: 'email', title: t('auth.email.title'), subtitle: t('auth.email.subtitle') },
        { key: 'password', title: t('auth.password.title'), subtitle: t('auth.password.subtitle', { email }) },
      ];
    } else if (flowType === 'register') {
      return [
        { key: 'email', title: t('auth.email.title'), subtitle: t('auth.email.subtitle') },
        { key: 'register', title: t('auth.register.title'), subtitle: t('auth.register.subtitle', { email }) },
      ];
    }
    return [
      { key: 'email', title: t('auth.email.title'), subtitle: t('auth.email.subtitle') },
    ];
  };

  const steps = getSteps();
  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const currentStepConfig = steps[currentStepIndex];

  const animateToNextStep = (nextStep: Step) => {
    setIsTransitioning(true);

    // Fade out and slide left
    contentOpacity.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) });
    slideX.value = withTiming(-50, { duration: 150, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(setCurrentStep)(nextStep);
      // Reset position to right and fade in
      slideX.value = 50;
      slideX.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
      contentOpacity.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(setIsTransitioning)(false);
      });
    });
  };

  const animateToPrevStep = (prevStep: Step) => {
    setIsTransitioning(true);

    // Fade out and slide right
    contentOpacity.value = withTiming(0, { duration: 150, easing: Easing.out(Easing.ease) });
    slideX.value = withTiming(50, { duration: 150, easing: Easing.out(Easing.ease) }, () => {
      runOnJS(setCurrentStep)(prevStep);
      // Reset position to left and fade in
      slideX.value = -50;
      slideX.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
      contentOpacity.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) }, () => {
        runOnJS(setIsTransitioning)(false);
      });
    });
  };

  // Validation functions
  const validateEmail = (): string => {
    if (!email.trim()) return t('auth.errors.requiredField');
    if (!emailRegex.test(email)) return t('auth.errors.invalidEmail');
    return '';
  };

  const validatePassword = (): string => {
    if (!password) return t('auth.errors.requiredField');
    if (flowType === 'register' && password.length < 8) return t('auth.errors.passwordTooShort');
    return '';
  };

  const validateUsername = (): string => {
    if (!username.trim()) return t('auth.errors.requiredField');
    if (username.length < 3) return t('auth.errors.usernameTooShort');
    if (username.length > 30) return t('auth.errors.usernameTooLong');
    if (username.includes(' ')) return t('auth.errors.usernameContainsSpace');
    return '';
  };

  const validateConfirmPassword = (): string => {
    if (!confirmPassword) return t('auth.errors.requiredField');
    if (password !== confirmPassword) return t('auth.errors.passwordMismatch');
    return '';
  };

  // Handlers
  const handleEmailContinue = async () => {
    const emailError = validateEmail();
    if (emailError) {
      setErrors(prev => ({ ...prev, email: emailError }));
      return;
    }

    try {
      const result = await checkEmailMutation.mutateAsync(email);

      if (result.exists) {
        setFlowType('login');
        animateToNextStep('password');
      } else {
        setFlowType('register');
        animateToNextStep('register');
      }
    } catch (err: any) {
      toast.error(t(handleErrorCodes(err)));
    }
  };

  const handleLogin = async () => {
    const passwordError = validatePassword();
    if (passwordError) {
      setErrors(prev => ({ ...prev, password: passwordError }));
      return;
    }
    await login(email, password);
  };

  const handleRegister = async () => {
    const usernameError = validateUsername();
    const passwordError = validatePassword();
    const confirmError = validateConfirmPassword();

    setErrors(prev => ({
      ...prev,
      username: usernameError,
      password: passwordError,
      confirmPassword: confirmError,
    }));

    if (usernameError || passwordError || confirmError) {
      toast.error(t('errors.errorCorrectionForm'));
      return;
    }

    await register(email, password, username);
  };

  const handleBack = () => {
    if (currentStep === 'email') {
      router.back();
    } else {
      // Reset to email step
      setFlowType(null);
      animateToPrevStep('email');
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: slideX.value }],
  }));

  // Determine button state
  const getButtonConfig = () => {
    switch (currentStep) {
      case 'email':
        return {
          title: t('auth.email.continue'),
          onPress: handleEmailContinue,
          disabled: !email.trim() || checkEmailMutation.isPending || isTransitioning,
        };
      case 'password':
        return {
          title: t('auth.password.loginButton'),
          onPress: handleLogin,
          disabled: !password || isLoading || isTransitioning,
        };
      case 'register':
        return {
          title: t('auth.register.createButton'),
          onPress: handleRegister,
          disabled: !username.trim() || !password || !confirmPassword || isLoading || isTransitioning,
        };
      default:
        return { title: '', onPress: () => {}, disabled: true };
    }
  };

  const buttonConfig = getButtonConfig();

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'email':
        return (
          <View style={styles.form}>
            <TextField
              label={t('auth.login.email')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors(prev => ({ ...prev, email: '' }));
              }}
              placeholder={t('auth.login.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              error={errors.email}
              returnKeyType="next"
              onSubmitEditing={handleEmailContinue}
            />
          </View>
        );

      case 'password':
        return (
          <View style={styles.form}>
            <TextField
              ref={passwordRef}
              label={t('auth.login.password')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder={t('auth.login.passwordPlaceholder')}
              type="password"
              autoFocus
              error={errors.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <LinkButton
              title={t('auth.login.forgotPassword')}
              onPress={handleForgotPassword}
              style={styles.forgotPassword}
            />
          </View>
        );

      case 'register':
        return (
          <View style={styles.form}>
            <TextField
              ref={usernameRef}
              label={t('auth.signup.username')}
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase().replace(/\s/g, ''));
                setErrors(prev => ({ ...prev, username: '' }));
              }}
              placeholder={t('auth.signup.usernamePlaceholder')}
              autoCapitalize="none"
              autoFocus
              error={errors.username}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label={t('auth.signup.password')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors(prev => ({ ...prev, password: '' }));
              }}
              placeholder={t('auth.signup.passwordPlaceholder')}
              type="password"
              error={errors.password}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
            <TextField
              ref={confirmPasswordRef}
              label={t('auth.signup.confirmPassword')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors(prev => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder={t('auth.signup.confirmPasswordPlaceholder')}
              type="password"
              error={errors.confirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Pressable
        style={[styles.keyboardView, { paddingTop: insets.top }]}
        onPress={Keyboard.dismiss}
      >
        <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

        {/* Header with back button */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Stepper */}
        <View style={styles.stepperContainer}>
          {flowType ? (
            steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: index <= currentStepIndex ? colors.accent : colors.border,
                    },
                  ]}
                />
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor: index < currentStepIndex ? colors.accent : colors.border,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            ))
          ) : (
            <View style={[styles.stepDot, { backgroundColor: colors.accent }]} />
          )}
        </View>

        {/* Animated Content */}
        <Animated.View style={[styles.content, contentStyle]}>
          <Text style={[typography.h1, styles.title, { color: colors.text }]}>
            {currentStepConfig?.title}
          </Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
            {currentStepConfig?.subtitle}
          </Text>

          {renderStepContent()}
        </Animated.View>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={buttonConfig.title}
            onPress={buttonConfig.onPress}
            disabled={buttonConfig.disabled}
            style={styles.button}
          />
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    height: 56,
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  buttonContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  button: {
    width: '100%',
  },
});
