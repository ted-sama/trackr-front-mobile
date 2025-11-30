import { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';

/**
 * Entitlement identifiers configured in RevenueCat dashboard
 */
export const ENTITLEMENTS = {
  TRACKR_PLUS: 'Trackr Plus',
} as const;

export type EntitlementId = typeof ENTITLEMENTS[keyof typeof ENTITLEMENTS];

/**
 * Product identifiers for subscription offerings
 */
export const PRODUCTS = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const;

export type ProductId = typeof PRODUCTS[keyof typeof PRODUCTS];

/**
 * Subscription plan types matching User.plan
 */
export type SubscriptionPlan = 'free' | 'plus';

/**
 * Subscription status interface
 */
export interface SubscriptionStatus {
  isSubscribed: boolean;
  plan: SubscriptionPlan;
  entitlement: PurchasesEntitlementInfo | null;
  expirationDate: Date | null;
  willRenew: boolean;
  isInTrial: boolean;
  isSandbox: boolean;
}

/**
 * Subscription context value interface
 */
export interface SubscriptionContextValue {
  /** Current customer info from RevenueCat */
  customerInfo: CustomerInfo | null;
  /** Whether the user has Trackr Plus entitlement */
  isTrackrPlus: boolean;
  /** Current subscription status */
  subscriptionStatus: SubscriptionStatus;
  /** Whether the SDK is configured and ready */
  isReady: boolean;
  /** Whether subscription data is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Present the paywall modal */
  presentPaywall: () => Promise<boolean>;
  /** Present the paywall only if user doesn't have entitlement */
  presentPaywallIfNeeded: () => Promise<boolean>;
  /** Present the Customer Center for subscription management */
  presentCustomerCenter: () => Promise<void>;
  /** Restore purchases */
  restorePurchases: () => Promise<boolean>;
  /** Refresh customer info */
  refreshCustomerInfo: () => Promise<void>;
  /** Log in user to RevenueCat */
  loginUser: (userId: string) => Promise<void>;
  /** Log out user from RevenueCat */
  logoutUser: () => Promise<void>;
}

