import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, StyleSheet } from 'react-native';
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
import VisibilitySelector from '@/components/ui/VisibilitySelector';
import { VisibilityLevel } from '@/types/user';

interface PrivacySectionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: VisibilityLevel;
  onChange: (value: VisibilityLevel) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}

function PrivacySection({ icon, label, description, value, onChange, disabled = false, badge }: PrivacySectionProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View
      style={[
        styles.privacyOption,
        { backgroundColor: colors.card }
      ]}
    >
      <View style={styles.privacyHeader}>
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
      <VisibilitySelector
        value={value}
        onChange={onChange}
        label=""
        disabled={disabled}
      />
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
  const { isTrackrPlus, presentPaywall, isLoading: isSubscriptionLoading } = useTrackrPlus();

  // Check Plus status from both RevenueCat and user store for reliability
  const hasPlus = isTrackrPlus || currentUser?.plan === 'plus';

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Convert legacy boolean values to visibility levels
  const getVisibilityLevel = (legacyValue: boolean | undefined, granularValue: VisibilityLevel | undefined): VisibilityLevel => {
    if (granularValue) return granularValue;
    return legacyValue !== false ? 'public' : 'private';
  };

  const statsVisibility = getVisibilityLevel(currentUser?.isStatsPublic, currentUser?.statsVisibility);
  const activityVisibility = getVisibilityLevel(currentUser?.isActivityPublic, currentUser?.activityVisibility);
  const libraryVisibility = getVisibilityLevel(currentUser?.isLibraryPublic, currentUser?.libraryVisibility);

  const handleStatsVisibilityChange = async (value: VisibilityLevel) => {
    if (!hasPlus) {
      presentPaywall();
      return;
    }
    updateMe.mutate({
      statsVisibility: value,
      isStatsPublic: value === 'public' || value === 'friends',
    });
  };

  const handleActivityVisibilityChange = (value: VisibilityLevel) => {
    updateMe.mutate({
      activityVisibility: value,
      isActivityPublic: value === 'public' || value === 'friends',
    });
  };

  const handleLibraryVisibilityChange = (value: VisibilityLevel) => {
    updateMe.mutate({
      libraryVisibility: value,
      isLibraryPublic: value === 'public' || value === 'friends',
    });
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
          <PrivacySection
            icon={<ChartNoAxesCombined size={20} color={colors.icon} />}
            label={t('settings.privacy.statsPublic')}
            description={t('settings.privacy.statsPublicDescription')}
            value={statsVisibility}
            onChange={handleStatsVisibilityChange}
            disabled={updateMe.isPending || (!hasPlus && !isSubscriptionLoading)}
            badge={<PlusBadge />}
          />
          <PrivacySection
            icon={<Notebook size={20} color={colors.icon} />}
            label={t('settings.privacy.activityPublic')}
            description={t('settings.privacy.activityPublicDescription')}
            value={activityVisibility}
            onChange={handleActivityVisibilityChange}
            disabled={updateMe.isPending}
          />
          <PrivacySection
            icon={<Library size={20} color={colors.icon} />}
            label={t('settings.privacy.libraryPublic')}
            description={t('settings.privacy.libraryPublicDescription')}
            value={libraryVisibility}
            onChange={handleLibraryVisibilityChange}
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
    gap: 16,
  },
  privacyOption: {
    padding: 16,
    borderRadius: 12,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
});
