import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';

interface BadgeProps {
  icon?: React.ReactNode;
  text: string;
  color: string;
  backgroundColor: string;
  borderColor?: string;
}

export default function Badge({ text, color, backgroundColor, icon, borderColor }: BadgeProps) {   
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View style={[styles.badge, { backgroundColor: backgroundColor, borderColor: borderColor }]}>
      {icon && icon}
      <Text style={[typography.badge, { color: color }]}>{text}</Text>
    </View>
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
    borderWidth: 0.75
  },
});

