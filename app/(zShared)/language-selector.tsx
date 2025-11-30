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
import i18n, { saveLanguagePreference } from '@/i18n';

interface LanguageOptionProps {
  label: string;
  nativeLabel: string;
  value: string;
  isSelected: boolean;
  onPress: () => void;
}

function LanguageOption({ label, nativeLabel, isSelected, onPress }: LanguageOptionProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <TouchableOpacity
      style={[
        styles.languageOption,
        { 
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.accent : 'transparent',
          borderWidth: 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.languageTextContainer}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600', marginBottom: 2 }]}>
          {label}
        </Text>
        <Text style={[typography.body, { color: colors.secondaryText, fontSize: 13 }]}>
          {nativeLabel}
        </Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
      )}
    </TouchableOpacity>
  );
}

export default function LanguageSelector() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const languageOptions = [
    {
      value: 'en',
      label: 'English',
      nativeLabel: 'English',
    },
    {
      value: 'fr',
      label: 'French',
      nativeLabel: 'Français',
    },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    await saveLanguagePreference(languageCode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />
      
      <AnimatedHeader
        title={t('settings.language.title')}
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
            {t('settings.language.title')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {languageOptions.map((option) => (
            <LanguageOption
              key={option.value}
              label={option.label}
              nativeLabel={option.nativeLabel}
              value={option.value}
              isSelected={i18n.language === option.value}
              onPress={() => handleLanguageChange(option.value)}
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
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  languageTextContainer: {
    flex: 1,
  },
});

