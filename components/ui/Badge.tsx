import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface BadgeProps {
  icon?: React.ReactNode;
  text: string;
  color: string;
  backgroundColor: string;
}

export default function Badge({ text, color, backgroundColor, icon }: BadgeProps) {   
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <Pressable style={[styles.badge, { backgroundColor: backgroundColor }]}>
      {icon && icon}
      <Text style={[typography.badge, { color: color }]}>{text}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 25,
  },
});

