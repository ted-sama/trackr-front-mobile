import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';

interface SummaryCardProps {
  foundCount: number;
  alreadyExistsCount: number;
  notFoundCount: number;
}

export function SummaryCard({ foundCount, alreadyExistsCount, notFoundCount }: SummaryCardProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIcon}>
            <CheckCircle size={20} color={colors.accent} />
          </View>
          <Text style={[typography.h3, { color: colors.text }]}>{foundCount}</Text>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {t('malImport.results.found')}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIcon}>
            <AlertCircle size={20} color={colors.icon} />
          </View>
          <Text style={[typography.h3, { color: colors.text }]}>{alreadyExistsCount}</Text>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {t('malImport.results.alreadyExists')}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <View style={styles.summaryIcon}>
            <XCircle size={20} color={colors.error} />
          </View>
          <Text style={[typography.h3, { color: colors.text }]}>{notFoundCount}</Text>
          <Text style={[typography.caption, { color: colors.secondaryText }]}>
            {t('malImport.results.notFound')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  summaryIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
