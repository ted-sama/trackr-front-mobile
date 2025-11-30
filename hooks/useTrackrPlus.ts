import { useCallback } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

/**
 * Hook to gate features behind Trackr Plus subscription
 * Provides utilities for checking access and prompting upgrade
 */
export function useTrackrPlus() {
  const {
    isTrackrPlus,
    subscriptionStatus,
    isLoading,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
  } = useSubscription();
  const { t } = useTranslation();
  const router = useRouter();

  /**
   * Check if user has access to a premium feature
   * If not, shows the paywall
   * @returns Promise<boolean> - true if user has access (or purchased)
   */
  const requireTrackrPlus = useCallback(async (): Promise<boolean> => {
    if (isTrackrPlus) return true;
    return presentPaywallIfNeeded();
  }, [isTrackrPlus, presentPaywallIfNeeded]);

  /**
   * Show upgrade prompt with custom message
   * @param featureName - Name of the feature being gated
   */
  const promptUpgrade = useCallback(
    async (featureName?: string): Promise<boolean> => {
      if (isTrackrPlus) return true;

      if (featureName) {
        toast.info(`${featureName} - ${t('subscription.upgradeToPro')}`);
      }

      return presentPaywall();
    },
    [isTrackrPlus, presentPaywall, t]
  );

  /**
   * Navigate to subscription management screen
   */
  const goToSubscription = useCallback(() => {
    router.push('/(zShared)/subscription');
  }, [router]);

  /**
   * Navigate directly to paywall screen
   */
  const goToPaywall = useCallback(() => {
    router.push('/(zShared)/paywall');
  }, [router]);

  /**
   * Open Customer Center for subscription management
   */
  const openCustomerCenter = useCallback(async () => {
    if (!isTrackrPlus) {
      toast.info(t('subscription.upgradeToPro'));
      return;
    }
    await presentCustomerCenter();
  }, [isTrackrPlus, presentCustomerCenter, t]);

  return {
    // State
    isTrackrPlus,
    subscriptionStatus,
    isLoading,
    isPremium: isTrackrPlus, // Alias

    // Actions
    requireTrackrPlus,
    promptUpgrade,
    goToSubscription,
    goToPaywall,
    openCustomerCenter,
    presentPaywall,
    presentPaywallIfNeeded,
  };
}

/**
 * Higher-order component to wrap premium-only features
 * Usage: const PremiumFeature = withTrackrPlus(MyComponent);
 */
export function withTrackrPlusCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function TrackrPlusGuard(props: P) {
    const { isTrackrPlus } = useTrackrPlus();

    if (!isTrackrPlus && FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    if (!isTrackrPlus) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

export default useTrackrPlus;

