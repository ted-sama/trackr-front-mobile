import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { toast } from 'sonner-native';
import { useMalImport } from '@/hooks/queries/malImport';
import { Download, ArrowRight } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [importComplete, setImportComplete] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const malImportMutation = useMalImport();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleImport = async () => {
    if (!username.trim()) {
      setError(t('auth.errors.requiredField'));
      return;
    }

    try {
      const response = await malImportMutation.mutateAsync(username.trim());
      setImportedCount(response.imported);
      setImportComplete(true);
      if (response.imported > 0) {
        toast.success(t('malImport.success', { count: response.imported }));
      }
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      if (errorCode === 'MAL_USER_NOT_FOUND') {
        setError(t('malImport.errors.userNotFound'));
      } else {
        toast.error(t('malImport.errors.generic'));
      }
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Pressable
        style={[styles.content, { paddingTop: insets.top }]}
        onPress={Keyboard.dismiss}
      >
        <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
            <Download size={32} color={colors.accent} />
          </View>
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          <Text style={[typography.h1, styles.title, { color: colors.text }]}>
            {t('onboarding.import.title')}
          </Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.secondaryText }]}>
            {t('onboarding.import.subtitle')}
          </Text>

          {!importComplete ? (
            <>
              <View style={styles.form}>
                <TextField
                  label={t('malImport.usernameLabel')}
                  placeholder={t('malImport.usernamePlaceholder')}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    setError('');
                  }}
                  error={error}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={[typography.caption, styles.note, { color: colors.secondaryText }]}>
                {t('onboarding.import.note')}
              </Text>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={[typography.h2, { color: colors.accent, textAlign: 'center' }]}>
                {importedCount > 0
                  ? t('onboarding.import.successWithCount', { count: importedCount })
                  : t('onboarding.import.noNewBooks')}
              </Text>
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {!importComplete ? (
            <>
              <Button
                title={malImportMutation.isPending ? t('malImport.importing') : t('malImport.importButton')}
                onPress={handleImport}
                disabled={malImportMutation.isPending}
                style={styles.button}
              />
              <Pressable
                onPressIn={() => {
                  scale.value = withTiming(0.98, { duration: 220 });
                }}
                onPressOut={() => {
                  scale.value = withTiming(1, { duration: 220 });
                }}
                onPress={handleSkip}
                disabled={malImportMutation.isPending}
              >
                <Animated.View style={[styles.skipButton, animatedStyle]}>
                  <Text style={[typography.body, { color: colors.secondaryText }]}>
                    {t('onboarding.import.skip')}
                  </Text>
                  <ArrowRight size={16} color={colors.secondaryText} />
                </Animated.View>
              </Pressable>
            </>
          ) : (
            <Button
              title={t('onboarding.import.continue')}
              onPress={handleContinue}
              style={styles.button}
            />
          )}
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  note: {
    textAlign: 'center',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  buttonContainer: {
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  button: {
    width: '100%',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
});
