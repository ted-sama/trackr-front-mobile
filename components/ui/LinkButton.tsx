import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface LinkButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function LinkButton({ title, onPress, style }: LinkButtonProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <Pressable onPress={onPress} style={[styles.button, style]}>
        <Text
          style={[
            typography.body,
            { color: colors.accent },
          ]}
        >
          {title}
        </Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 0,
    margin: 0,
  },
});