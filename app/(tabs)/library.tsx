import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

export default function Library() {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View>
      <Text style={[typography.h1, { color: colors.text }]}>Library</Text>
    </View>
  );
}
