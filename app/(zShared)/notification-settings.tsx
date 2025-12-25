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
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/queries/notifications';
import { Heart, Bookmark } from 'lucide-react-native';

interface NotificationToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

function NotificationToggle({ icon, label, description, value, onValueChange, disabled = false }: NotificationToggleProps) {
  const { colors } = useTheme();
  const typography = useTypography();

  return (
    <View
      style={[
        styles.toggleOption,
        { backgroundColor: colors.card }
      ]}
    >
      <View style={styles.toggleOptionLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
          {icon}
        </View>
        <View style={styles.toggleTextContainer}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '600', marginBottom: 2 }]}>
            {label}
          </Text>
          <Text style={[typography.body, { color: colors.secondaryText, fontSize: 13 }]}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.toggleOptionRight}>
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

export default function NotificationSettingsScreen() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);
  const { t } = useTranslation();

  const { data: notificationSettings, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleReviewLikesChange = (value: boolean) => {
    updateSettings.mutate({ notifyReviewLikes: value });
  };

  const handleListLikesChange = (value: boolean) => {
    updateSettings.mutate({ notifyListLikes: value });
  };

  const handleListSavesChange = (value: boolean) => {
    updateSettings.mutate({ notifyListSaves: value });
  };

  const isDisabled = isLoading || updateSettings.isPending;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === "dark" ? "light" : "dark"} />

      <AnimatedHeader
        title={t('settings.notifications.title')}
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
            {t('settings.notifications.title')}
          </Text>
        </View>

        <Text style={[typography.body, { color: colors.secondaryText, marginBottom: 24 }]}>
          {t('settings.notifications.description')}
        </Text>

        <View style={styles.optionsContainer}>
          <NotificationToggle
            icon={<Heart size={20} color={colors.icon} />}
            label={t('settings.notifications.reviewLikes')}
            description={t('settings.notifications.reviewLikesDescription')}
            value={notificationSettings?.notifyReviewLikes ?? true}
            onValueChange={handleReviewLikesChange}
            disabled={isDisabled}
          />
          <NotificationToggle
            icon={<Heart size={20} color={colors.icon} />}
            label={t('settings.notifications.listLikes')}
            description={t('settings.notifications.listLikesDescription')}
            value={notificationSettings?.notifyListLikes ?? true}
            onValueChange={handleListLikesChange}
            disabled={isDisabled}
          />
          <NotificationToggle
            icon={<Bookmark size={20} color={colors.icon} />}
            label={t('settings.notifications.listSaves')}
            description={t('settings.notifications.listSavesDescription')}
            value={notificationSettings?.notifyListSaves ?? true}
            onValueChange={handleListSavesChange}
            disabled={isDisabled}
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
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  toggleOptionLeft: {
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
  toggleTextContainer: {
    flex: 1,
  },
  toggleOptionRight: {
    marginRight: 12,
  },
});
