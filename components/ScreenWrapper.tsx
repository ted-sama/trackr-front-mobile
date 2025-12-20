import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorState } from '@/components/ErrorState';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Header component that will be shown even when there's an error */
  header?: React.ReactNode;
  /** Error object - if provided, will show ErrorState instead of children */
  error?: Error | null;
  /** Callback for retry button in error state */
  onRetry?: () => void;
  /** Custom error message */
  errorMessage?: string;
}

export function ScreenWrapper({
  children,
  header,
  error,
  onRetry,
  errorMessage,
}: ScreenWrapperProps) {
  const { colors } = useTheme();

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <ErrorState onRetry={onRetry} message={errorMessage} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
