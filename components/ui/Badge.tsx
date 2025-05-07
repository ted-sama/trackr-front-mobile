import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface BadgeProps {
  text: string;
  color: string;
  backgroundColor: string;
}

export default function Badge({ text, color, backgroundColor }: BadgeProps) {   
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <Pressable style={[styles.badge, { backgroundColor: backgroundColor }]}>
      <Text style={[typography.caption, { color: color }]}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 25,
  },
});

