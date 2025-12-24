import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useTypography } from '@/hooks/useTypography';
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';

export default function Paywall() {
  const { colors, currentTheme } = useTheme();
  const typography = useTypography();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { refreshCustomerInfo } = useSubscription();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOffering();
  }, []);

  const loadOffering = async () => {
    try {
      setIsLoading(true);
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOffering(offerings.current);
      } else {
        setError(t('subscription.noOfferingsAvailable'));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('subscription.errorLoadingOfferings');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    router.back();
  };

  const handlePurchaseCompleted = async ({
    customerInfo,
  }: {
    customerInfo: CustomerInfo;
  }) => {
    await refreshCustomerInfo();
    router.back();
  };

  const handleRestoreCompleted = async ({
    customerInfo,
  }: {
    customerInfo: CustomerInfo;
  }) => {
    await refreshCustomerInfo();
    // Only dismiss if user now has entitlement
    if (customerInfo.entitlements.active['Trackr Plus']) {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[typography.body, { color: colors.secondaryText, marginTop: 16 }]}>
          {t('subscription.loadingOfferings')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
        <Text style={[typography.body, { color: colors.error, textAlign: 'center' }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
      <RevenueCatUI.Paywall
        options={{
          offering: offering ?? undefined,
          displayCloseButton: true,
          fontFamily: 'Manrope_500Medium',
        }}
        onPurchaseStarted={({ packageBeingPurchased }) => {
          console.log('Purchase started:', packageBeingPurchased.identifier);
        }}
        onPurchaseCompleted={handlePurchaseCompleted}
        onPurchaseError={({ error: purchaseError }) => {
          console.error('Purchase error:', purchaseError.message);
        }}
        onPurchaseCancelled={() => {
          console.log('Purchase cancelled');
        }}
        onRestoreStarted={() => {
          console.log('Restore started');
        }}
        onRestoreCompleted={handleRestoreCompleted}
        onRestoreError={({ error: restoreError }) => {
          console.error('Restore error:', restoreError.message);
        }}
        onDismiss={handleDismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});

