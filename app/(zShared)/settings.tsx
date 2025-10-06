import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import Constants from 'expo-constants';
import i18n from '@/i18n';

export default function Settings() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const { logout } = useAuth();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();
  const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      
      <AnimatedHeader
        title={'Settings'}
        scrollY={scrollY}
        onBack={() => router.back()}
        collapseThreshold={titleY > 0 ? titleY : undefined}
      />

      <AnimatedScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={{ marginTop: insets.top + 70, paddingBottom: 64, paddingHorizontal: 16 }}>
        <View>
          <Text style={[typography.h1, { color: colors.text, marginBottom: 16 }]}>{t("settings.title")}</Text>
          <View style={styles.settingsContainer}>
            <Button onPress={() => router.push('/auth/login')} title="Login screen" />
            <Button onPress={logout} title="Logout" />
            <ThemeToggle />
            <Text style={[typography.body, { color: colors.text, marginBottom: 16 }]}>{t("settings.language")}</Text>
            <Button onPress={() => i18n.changeLanguage('en')} title={t("languages.english")} />
            <Button onPress={() => i18n.changeLanguage('fr')} title={t("languages.french")} />
            <Text style={[typography.body, { color: colors.text, marginBottom: 16 }]}>Version {Constants.expoConfig?.version}</Text>
          </View>
        </View>
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 30,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsContainer: {
    gap: 16,
  },
});
