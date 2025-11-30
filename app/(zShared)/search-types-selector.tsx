import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore, BookType, ALL_BOOK_TYPES } from '@/stores/uiStore';

interface TypeOptionProps {
  type: BookType;
  label: string;
  isEnabled: boolean;
  onToggle: () => void;
  canDisable: boolean;
}

function TypeOption({ type, label, isEnabled, onToggle, canDisable }: TypeOptionProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  const isDisabled = !canDisable && isEnabled;

  return (
    <View
      style={[
        styles.typeOption,
        { 
          backgroundColor: colors.card,
          opacity: isDisabled ? 0.6 : 1,
        }
      ]}
    >
      <View style={styles.typeOptionLeft}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '500' }]}>
          {label}
        </Text>
      </View>
      <View>
        <Switch
            value={isEnabled}
            onValueChange={onToggle}
            disabled={isDisabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
            ios_backgroundColor={colors.border}
        />
      </View>
    </View>
  );
}

export default function SearchTypesSelector() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();

  const searchTypes = useUIStore((state) => state.searchTypes);
  const toggleSearchType = useUIStore((state) => state.toggleSearchType);
  const resetSearchTypes = useUIStore((state) => state.resetSearchTypes);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const enabledCount = searchTypes.length;
  const canDisable = enabledCount > 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      
      <AnimatedHeader
        title={t('settings.search.types')}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <Animated.ScrollView 
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ 
          marginTop: insets.top, 
          paddingBottom: 64, 
          paddingHorizontal: 16 
        }}
      >
        <View style={styles.header} onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}>
          <Text style={[typography.h1, { color: colors.text }]}>
            {t('settings.search.types')}
          </Text>
        </View>

        <View style={styles.descriptionContainer}>
          <Text style={[typography.body, { color: colors.secondaryText, fontSize: 14 }]}>
            {t('settings.search.typesDescription')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {ALL_BOOK_TYPES.map((type) => (
            <TypeOption
              key={type}
              type={type}
              label={t(`common.bookTypes.${type}`)}
              isEnabled={searchTypes.includes(type)}
              onToggle={() => toggleSearchType(type)}
              canDisable={canDisable}
            />
          ))}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[typography.body, { color: colors.secondaryText, fontSize: 13 }]}>
            {t('settings.search.typesInfo', { count: enabledCount, total: ALL_BOOK_TYPES.length })}
          </Text>
        </View>

        {enabledCount < ALL_BOOK_TYPES.length && (
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.card }]}
            onPress={resetSearchTypes}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={colors.accent} />
            <Text style={[typography.body, { color: colors.accent, fontWeight: '500', marginLeft: 8 }]}>
              {t('settings.search.resetTypes')}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 70,
    marginBottom: 24,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 10,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  typeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContainer: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
});

