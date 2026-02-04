import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import {
  ENTITLEMENTS,
  SubscriptionContextValue,
  SubscriptionStatus,
  SubscriptionPlan,
} from '@/types/subscription';
import { useUserStore } from '@/stores/userStore';

// RevenueCat API Key (loaded from environment variable)
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY!;

// Default subscription status
const defaultSubscriptionStatus: SubscriptionStatus = {
  isSubscribed: false,
  plan: 'free',
  entitlement: null,
  expirationDate: null,
  willRenew: false,
  isInTrial: false,
  isSandbox: false,
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>(defaultSubscriptionStatus);
  
  // Track previous plan to detect changes
  const previousPlanRef = useRef<SubscriptionPlan>('free');
  
  // Get user store functions
  const updatePlan = useUserStore((state) => state.updatePlan);
  const currentUser = useUserStore((state) => state.currentUser);

  /**
   * Parse customer info to determine subscription status
   */
  const parseSubscriptionStatus = useCallback(
    (info: CustomerInfo | null): SubscriptionStatus => {
      if (!info) {
        return defaultSubscriptionStatus;
      }

      const trackrPlusEntitlement =
        info.entitlements.active[ENTITLEMENTS.TRACKR_PLUS];
      const isSubscribed = !!trackrPlusEntitlement;

      if (!isSubscribed || !trackrPlusEntitlement) {
        return defaultSubscriptionStatus;
      }

      return {
        isSubscribed: true,
        plan: 'plus',
        entitlement: trackrPlusEntitlement,
        expirationDate: trackrPlusEntitlement.expirationDate
          ? new Date(trackrPlusEntitlement.expirationDate)
          : null,
        willRenew: trackrPlusEntitlement.willRenew,
        isInTrial:
          trackrPlusEntitlement.periodType === 'TRIAL' ||
          trackrPlusEntitlement.periodType === 'INTRO',
        isSandbox: trackrPlusEntitlement.isSandbox,
      };
    },
    []
  );

  /**
   * Initialize the RevenueCat SDK
   */
  const initializeSDK = useCallback(async () => {
    try {
      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure the SDK
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: null, // Anonymous user initially
      });

      // Verify configuration
      const configured = await Purchases.isConfigured();
      if (!configured) {
        throw new Error('RevenueCat SDK failed to configure');
      }

      // Get initial customer info
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setSubscriptionStatus(parseSubscriptionStatus(info));
      setIsReady(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize RevenueCat';
      if (__DEV__) console.error('RevenueCat initialization error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [parseSubscriptionStatus]);

  /**
   * Set up customer info listener for real-time updates
   */
  useEffect(() => {
    initializeSDK();

    // Listen for customer info changes
    const customerInfoListener = (info: CustomerInfo) => {
      setCustomerInfo(info);
      setSubscriptionStatus(parseSubscriptionStatus(info));
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, [initializeSDK, parseSubscriptionStatus]);

  /**
   * Sync subscription status with user store in real-time
   * This ensures the app reflects plan changes immediately
   */
  useEffect(() => {
    const currentPlan = subscriptionStatus.plan;
    
    // Only update if:
    // 1. User is logged in (currentUser exists)
    // 2. Plan has actually changed from the previous value
    if (currentUser && previousPlanRef.current !== currentPlan) {
      if (__DEV__) console.log(
        `[RevenueCat] Plan changed: ${previousPlanRef.current} -> ${currentPlan}`
      );
      updatePlan(currentPlan);
      previousPlanRef.current = currentPlan;
    }
  }, [subscriptionStatus.plan, currentUser, updatePlan]);

  /**
   * Present the paywall modal
   */
  const presentPaywall = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await RevenueCatUI.presentPaywall({
        displayCloseButton: true,
      });

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Refresh customer info after purchase
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
          setSubscriptionStatus(parseSubscriptionStatus(info));
          return true;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        default:
          return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to present paywall';
      if (__DEV__) console.error('Paywall error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [parseSubscriptionStatus]);

  /**
   * Present the paywall only if user doesn't have the Trackr Plus entitlement
   */
  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENTS.TRACKR_PLUS,
        displayCloseButton: true,
      });

      switch (result) {
        case PAYWALL_RESULT.NOT_PRESENTED:
          // User already has entitlement
          return true;
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Refresh customer info after purchase
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
          setSubscriptionStatus(parseSubscriptionStatus(info));
          return true;
        case PAYWALL_RESULT.CANCELLED:
        case PAYWALL_RESULT.ERROR:
        default:
          return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to present paywall';
      if (__DEV__) console.error('Paywall error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [parseSubscriptionStatus]);

  /**
   * Present the Customer Center for subscription management
   */
  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onFeedbackSurveyCompleted: ({ feedbackSurveyOptionId }) => {
            if (__DEV__) console.log('Feedback survey completed:', feedbackSurveyOptionId);
          },
          onShowingManageSubscriptions: () => {
            if (__DEV__) console.log('Showing manage subscriptions');
          },
          onRestoreStarted: () => {
            if (__DEV__) console.log('Restore started');
          },
          onRestoreCompleted: async ({ customerInfo: restoredInfo }) => {
            if (__DEV__) console.log('Restore completed');
            setCustomerInfo(restoredInfo);
            setSubscriptionStatus(parseSubscriptionStatus(restoredInfo));
          },
          onRestoreFailed: ({ error: restoreError }) => {
            if (__DEV__) console.error('Restore failed:', restoreError);
          },
          onRefundRequestStarted: ({ productIdentifier }) => {
            if (__DEV__) console.log('Refund request started for:', productIdentifier);
          },
          onRefundRequestCompleted: async ({
            productIdentifier,
            refundRequestStatus,
          }) => {
            if (__DEV__) console.log(
              'Refund request completed:',
              productIdentifier,
              refundRequestStatus
            );
            // Refresh customer info after refund to update subscription status
            try {
              const info = await Purchases.getCustomerInfo();
              setCustomerInfo(info);
              setSubscriptionStatus(parseSubscriptionStatus(info));
            } catch (e) {
              if (__DEV__) console.error('Failed to refresh after refund:', e);
            }
          },
          onManagementOptionSelected: ({ option, url }) => {
            if (__DEV__) console.log('Management option selected:', option, url);
          },
        },
      });
      
      // Refresh customer info when Customer Center is closed
      // This catches any changes made through the native subscription management
      try {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
        setSubscriptionStatus(parseSubscriptionStatus(info));
      } catch (e) {
        if (__DEV__) console.error('Failed to refresh after Customer Center:', e);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to present customer center';
      if (__DEV__) console.error('Customer center error:', errorMessage);
      setError(errorMessage);
    }
  }, [parseSubscriptionStatus]);

  /**
   * Restore purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      setSubscriptionStatus(parseSubscriptionStatus(info));
      return !!info.entitlements.active[ENTITLEMENTS.TRACKR_PLUS];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to restore purchases';
      if (__DEV__) console.error('Restore error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [parseSubscriptionStatus]);

  /**
   * Refresh customer info
   */
  const refreshCustomerInfo = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setSubscriptionStatus(parseSubscriptionStatus(info));
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh customer info';
      if (__DEV__) console.error('Refresh error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [parseSubscriptionStatus]);

  /**
   * Log in user to RevenueCat (call when user logs in to your app)
   */
  const loginUser = useCallback(
    async (userId: string): Promise<void> => {
      try {
        setIsLoading(true);
        const { customerInfo: info } = await Purchases.logIn(userId);
        setCustomerInfo(info);
        setSubscriptionStatus(parseSubscriptionStatus(info));
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to log in user';
        if (__DEV__) console.error('Login error:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [parseSubscriptionStatus]
  );

  /**
   * Log out user from RevenueCat (call when user logs out of your app)
   */
  const logoutUser = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const info = await Purchases.logOut();
      setCustomerInfo(info);
      setSubscriptionStatus(parseSubscriptionStatus(info));
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to log out user';
      if (__DEV__) console.error('Logout error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [parseSubscriptionStatus]);

  const isTrackrPlus =
    !!customerInfo?.entitlements.active[ENTITLEMENTS.TRACKR_PLUS];

  const value: SubscriptionContextValue = {
    customerInfo,
    isTrackrPlus,
    subscriptionStatus,
    isReady,
    isLoading,
    error,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    restorePurchases,
    refreshCustomerInfo,
    loginUser,
    logoutUser,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access subscription context
 */
export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
}

/**
 * Hook to check if user has Trackr Plus entitlement
 * Shorthand for useSubscription().isTrackrPlus
 */
export function useIsTrackrPlus(): boolean {
  const { isTrackrPlus } = useSubscription();
  return isTrackrPlus;
}

/**
 * Hook to gate features behind Trackr Plus
 * Returns true if user has access, otherwise presents paywall
 */
export function useTrackrPlusGate(): {
  checkAccess: () => Promise<boolean>;
  isTrackrPlus: boolean;
  isLoading: boolean;
} {
  const { isTrackrPlus, presentPaywallIfNeeded, isLoading } = useSubscription();

  const checkAccess = useCallback(async (): Promise<boolean> => {
    if (isTrackrPlus) return true;
    return presentPaywallIfNeeded();
  }, [isTrackrPlus, presentPaywallIfNeeded]);

  return { checkAccess, isTrackrPlus, isLoading };
}

