import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AnimatedHeader } from '@/components/shared/AnimatedHeader';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner-native';
import Button from '@/components/ui/Button';
import SecondaryButton from '@/components/ui/SecondaryButton';
import PlusBadge from '@/components/ui/PlusBadge';

export default function Subscription() {
  const { colors, currentTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const typography = useTypography();
  const router = useRouter();
  const { t } = useTranslation();
  const scrollY = useSharedValue(0);
  const [titleY, setTitleY] = useState<number>(0);

  const {
    isTrackrPlus,
    subscriptionStatus,
    isLoading,
    presentPaywall,
    presentCustomerCenter,
    restorePurchases,
  } = useSubscription();

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const handleUpgrade = async () => {
    const success = await presentPaywall();
    if (success) {
      toast.success(t('subscription.upgradeSuccess'));
    }
  };

  const handleManageSubscription = async () => {
    await presentCustomerCenter();
  };

  const handleRestorePurchases = async () => {
    const success = await restorePurchases();
    if (success) {
      toast.success(t('subscription.restoreSuccess'));
    } else {
      toast.error(t('subscription.restoreFailed'));
    }
  };

  const formatExpirationDate = (date: Date | null): string => {
    if (!date) return t('subscription.noExpiration');
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />

      <AnimatedHeader
        title={t('subscription.title')}
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
          paddingHorizontal: 16,
        }}
      >
        <View
          style={styles.header}
          onLayout={(e) => setTitleY(e.nativeEvent.layout.y)}
        >
          <Text style={[typography.h1, { color: colors.text }]}>
            {t('subscription.title')}
          </Text>
        </View>

        {/* Current Plan Card */}
        <View style={[styles.planCard, { backgroundColor: colors.card }]}>
          <View style={styles.planHeader}>
            <View
              style={[
                styles.planBadge,
                {
                  backgroundColor: isTrackrPlus
                    ? colors.accent
                    : colors.secondaryText,
                },
              ]}
            >
              <Ionicons
                name={isTrackrPlus ? 'star' : 'person'}
                size={16}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.planInfo}>
              <Text style={[typography.h3, { color: colors.text }]}>
                {isTrackrPlus
                  ? t('subscription.trackrPlus')
                  : t('subscription.freePlan')}
              </Text>
              <Text style={[typography.caption, { color: colors.secondaryText }]}>
                {isTrackrPlus
                  ? t('subscription.premiumFeatures')
                  : t('subscription.basicFeatures')}
              </Text>
            </View>
          </View>

          {isTrackrPlus && (
            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Text style={[typography.body, { color: colors.secondaryText }]}>
                  {t('subscription.status')}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  {subscriptionStatus.willRenew
                    ? t('subscription.active')
                    : t('subscription.cancelled')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[typography.body, { color: colors.secondaryText }]}>
                  {subscriptionStatus.willRenew
                    ? t('subscription.renewsOn')
                    : t('subscription.expiresOn')}
                </Text>
                <Text style={[typography.body, { color: colors.text }]}>
                  {formatExpirationDate(subscriptionStatus.expirationDate)}
                </Text>
              </View>
              {subscriptionStatus.isInTrial && (
                <View style={styles.trialBadge}>
                  <Ionicons name="time-outline" size={14} color={colors.accent} />
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.accent, marginLeft: 4 },
                    ]}
                  >
                    {t('subscription.trialActive')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {!isTrackrPlus ? (
            <Button
              title={t('subscription.upgradeToPro')}
              onPress={handleUpgrade}
              disabled={isLoading}
              icon={<Ionicons name="star" size={20} color="#FFFFFF" />}
            />
          ) : (
            <SecondaryButton
              title={t('subscription.manageSubscription')}
              onPress={handleManageSubscription}
              disabled={isLoading}
              icon={<Ionicons name="settings-outline" size={20} color={colors.text} />}
            />
          )}

          <SecondaryButton
            title={t('subscription.restorePurchases')}
            onPress={handleRestorePurchases}
            disabled={isLoading}
            icon={<Ionicons name="refresh-outline" size={20} color={colors.text} />}
          />
        </View>

        {/* Features List */}
        {!isTrackrPlus && (
          <View style={styles.featuresSection}>
            <View style={styles.whatYouGetHeader}>
              <Text
                style={[
                  typography.h3,
                  { color: colors.text },
                ]}
              >
                {t('subscription.whatYouGetWith')}
              </Text>
              <PlusBadge />
            </View>
            <FeatureItem
              icon="image-outline"
              title={t('subscription.features.customBackdrops')}
              description={t('subscription.features.customBackdropsDesc')}
              colors={colors}
              typography={typography}
            />
            <FeatureItem
              icon="sparkles-outline"
              title={t('subscription.features.aiChat')}
              description={t('subscription.features.aiChatDesc')}
              colors={colors}
              typography={typography}
            />
            <FeatureItem
              icon="analytics-outline"
              title={t('subscription.features.advancedStats')}
              description={t('subscription.features.advancedStatsDesc')}
              colors={colors}
              typography={typography}
            />
            <FeatureItem
              icon="ribbon-outline"
              title={t('subscription.features.exclusiveBadges')}
              description={t('subscription.features.exclusiveBadgesDesc')}
              colors={colors}
              typography={typography}
            />
            <FeatureItem
              icon="heart-outline"
              title={t('subscription.features.supportDev')}
              description={t('subscription.features.supportDevDesc')}
              colors={colors}
              typography={typography}
            />
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  colors: any;
  typography: any;
}

function FeatureItem({
  icon,
  title,
  description,
  colors,
  typography,
}: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View
        style={[styles.featureIcon, { backgroundColor: colors.card }]}
      >
        <Ionicons name={icon} size={24} color={colors.accent} />
      </View>
      <View style={styles.featureContent}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
          {title}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.secondaryText, marginTop: 2 },
          ]}
        >
          {description}
        </Text>
      </View>
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
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    marginLeft: 16,
    flex: 1,
  },
  subscriptionDetails: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 32,
  },
  featuresSection: {
    marginTop: 8,
  },
  whatYouGetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
  },
});

