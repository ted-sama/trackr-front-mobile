import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface ThemeOptionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  value: 'light' | 'dark' | 'system';
  isSelected: boolean;
  onPress: () => void;
}

function ThemeOption({ icon, label, description, isSelected, onPress }: ThemeOptionProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { 
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.accent : 'transparent',
          borderWidth: 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.themeOptionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={isSelected ? colors.accent : colors.icon} 
          />
        </View>
        <View style={styles.themeTextContainer}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '600', marginBottom: 2 }]}>
            {label}
          </Text>
          <Text style={[typography.body, { color: colors.secondaryText, fontSize: 13 }]}>
            {description}
          </Text>
        </View>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
      )}
    </TouchableOpacity>
  );
}

export default function ThemeSelector() {
  const { colors, currentTheme, theme, setTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const themeOptions = [
    {
      value: 'light' as const,
      icon: 'sunny' as const,
      label: t('languages.french') === 'Français' ? 'Clair' : 'Light',
      description: t('languages.french') === 'Français' 
        ? 'Utiliser le mode clair' 
        : 'Use light mode',
    },
    {
      value: 'dark' as const,
      icon: 'moon' as const,
      label: t('languages.french') === 'Français' ? 'Sombre' : 'Dark',
      description: t('languages.french') === 'Français' 
        ? 'Utiliser le mode sombre' 
        : 'Use dark mode',
    },
    {
      value: 'system' as const,
      icon: 'settings-outline' as const,
      label: t('languages.french') === 'Français' ? 'Système' : 'System',
      description: t('languages.french') === 'Français' 
        ? 'Suivre les réglages du système' 
        : 'Follow system settings',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      
      <AnimatedHeader
        title={t('settings.appearance.theme')}
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
            {t('settings.appearance.theme')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => (
            <ThemeOption
              key={option.value}
              icon={option.icon}
              label={option.label}
              description={option.description}
              value={option.value}
              isSelected={theme === option.value}
              onPress={() => setTheme(option.value)}
            />
          ))}
        </View>
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
  optionsContainer: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  themeTextContainer: {
    flex: 1,
  },
});

