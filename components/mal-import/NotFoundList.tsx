import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';

interface NotFoundListProps {
  titles: string[];
}

export function NotFoundList({ titles }: NotFoundListProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  if (titles.length === 0) return null;

  return (
    <View style={styles.notFoundSection}>
      <Text style={[typography.caption, { color: colors.secondaryText, marginBottom: 8 }]}>
        {t('malImport.results.notFoundList')} ({titles.length})
      </Text>
      <View style={[styles.notFoundCard, { backgroundColor: colors.card }]}>
        {titles.slice(0, 5).map((title, index) => (
          <Text
            key={`${title}-${index}`}
            style={[typography.caption, { color: colors.secondaryText, paddingVertical: 4 }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        ))}
        {titles.length > 5 && (
          <Text style={[typography.caption, { color: colors.secondaryText, paddingVertical: 4 }]}>
            {t('malImport.results.andMore', { count: titles.length - 5 })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  notFoundSection: {
    marginTop: 24,
  },
  notFoundCard: {
    borderRadius: 8,
    padding: 12,
  },
});
