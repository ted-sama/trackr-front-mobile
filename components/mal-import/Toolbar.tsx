import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useTranslation } from 'react-i18next';
import SwitchLayoutButton from '@/components/SwitchLayoutButton';

interface ToolbarProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSwitchLayout: () => void;
  currentLayout: 'grid' | 'list';
}

export function Toolbar({ onSelectAll, onDeselectAll, onSwitchLayout, currentLayout }: ToolbarProps) {
  const { colors } = useTheme();
  const typography = useTypography();
  const { t } = useTranslation();

  return (
    <View style={styles.toolbar}>
      <View style={styles.selectActions}>
        <Pressable onPress={onSelectAll}>
          <Text style={[typography.caption, { color: colors.accent }]}>{t('malImport.selectAll')}</Text>
        </Pressable>
        <View style={[styles.selectDivider, { backgroundColor: colors.border }]} />
        <Pressable onPress={onDeselectAll}>
          <Text style={[typography.caption, { color: colors.accent }]}>{t('malImport.deselectAll')}</Text>
        </Pressable>
      </View>

      <SwitchLayoutButton onPress={onSwitchLayout} currentView={currentLayout} />
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 12,
    borderRadius: 1,
  },
});
