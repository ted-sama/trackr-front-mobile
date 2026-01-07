import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useRouter } from 'expo-router';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useUserStore } from '@/stores/userStore';
import { useUpdateMe } from '@/hooks/queries/users';
import { ChartNoAxesCombined, Notebook, Library } from 'lucide-react-native';
import { useTrackrPlus } from '@/hooks/useTrackrPlus';
import PlusBadge from '@/components/ui/PlusBadge';

interface PrivacyToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}

function PrivacyToggle({ icon, label, description, value, onValueChange, disabled = false, badge }: PrivacyToggleProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View
      style={[
        styles.privacyOption,
        { backgroundColor: colors.card }
      ]}
    >
      <View style={styles.privacyOptionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          {icon}
        </View>
        <View style={styles.privacyTextContainer}>
          <View style={styles.labelContainer}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '600', marginBottom: 2 }]}>
              {label}
            </Text>
            {badge}
          </View>
          <Text style={[typography.body, { color: colors.secondaryText, fontSize: 13 }]}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.privacyOptionRight}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#ffffff"
        />
      </View>
    </View>
  );
}

export default function PrivacyScreen() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();
  const currentUser = useUserStore((state) => state.currentUser);
  const updateMe = useUpdateMe();
  const { isTrackrPlus, presentPaywall } = useTrackrPlus();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleStatsPrivacyChange = async (value: boolean) => {
    if (!isTrackrPlus) {
      presentPaywall();
      return;
    }
    updateMe.mutate({ isStatsPublic: value });
  };

  const handleActivityPrivacyChange = (value: boolean) => {
    updateMe.mutate({ isActivityPublic: value });
  };

  const handleLibraryPrivacyChange = (value: boolean) => {
    updateMe.mutate({ isLibraryPublic: value });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t('settings.privacy.title')}
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
            {t('settings.privacy.title')}
          </Text>
        </View>

        <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 24 }]}>
          {t('settings.privacy.description')}
        </Text>

        <View style={styles.optionsContainer}>
          <PrivacyToggle
            icon={<ChartNoAxesCombined size={20} color={colors.icon} />}
            label={t('settings.privacy.statsPublic')}
            description={t('settings.privacy.statsPublicDescription')}
            value={currentUser.isStatsPublic}
            onValueChange={handleStatsPrivacyChange}
            disabled={updateMe.isPending || !isTrackrPlus}
            badge={<PlusBadge />}
          />
          <PrivacyToggle
            icon={<Notebook size={20} color={colors.icon} />}
            label={t('settings.privacy.activityPublic')}
            description={t('settings.privacy.activityPublicDescription')}
            value={currentUser.isActivityPublic}
            onValueChange={handleActivityPrivacyChange}
            disabled={updateMe.isPending}
          />
          <PrivacyToggle
            icon={<Library size={20} color={colors.icon} />}
            label={t('settings.privacy.libraryPublic')}
            description={t('settings.privacy.libraryPublicDescription')}
            value={currentUser.isLibraryPublic}
            onValueChange={handleLibraryPrivacyChange}
            disabled={updateMe.isPending}
          />
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
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  privacyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  privacyTextContainer: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyOptionRight: {
    marginRight: 12,
  },
});
