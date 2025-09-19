import React from 'react';
import { Image } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface AvatarProps {
  image: string;
  size: number;
}

export default function Avatar({ image, size }: AvatarProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <Image source={{ uri: image }} style={[styles.image, { width: size, height: size }]} />
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