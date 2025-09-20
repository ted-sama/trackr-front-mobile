import React from 'react';
import { Image } from 'expo-image';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface AvatarProps {
  image: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  borderWidth?: number;
  borderColor?: string;
}

export default function Avatar({ image, size, style, borderWidth, borderColor }: AvatarProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={[styles.avatar, { width: size, height: size }, style]}>
      <Image source={{ uri: image }} style={[styles.image, { width: size + (borderWidth || 0) * 2, height: size + (borderWidth || 0) * 2, borderWidth: borderWidth, borderColor: borderColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 100,
  },
  image: {
    borderRadius: 100,
  },
});