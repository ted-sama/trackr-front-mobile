import React from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { AlertCircle } from 'lucide-react-native';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <Pressable
      onPress={onRetry}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <AlertCircle size={64} color={colors.secondaryText} strokeWidth={2.25} />
      <Text style={[styles.title, { color: colors.text }]}>
        {t('error.title')}
      </Text>
      <Text style={[typography.caption, styles.subtitle, { color: colors.secondaryText }]}>
        {message || t('error.subtitle')}
      </Text>
      {onRetry && (
        <Text style={[typography.caption, styles.tapToRetry, { color: colors.secondaryText }]}>
          {t('error.tapToRetry')}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 22,
    marginTop: 24,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  tapToRetry: {
    marginTop: 24,
    textAlign: 'center',
  },
});
