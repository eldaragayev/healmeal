import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevSettings } from 'react-native';
import { useSubscription } from '@/hooks/useSubscription';
import { SymbolView } from 'expo-symbols';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { posthog } from '@/analytics';
import { tenjinEvent } from '@/hooks/useTenjin';

const DISCOUNT_OFFERING_ID = 'discount';

interface Props {
  onPurchased?: () => void;
}

export function HardPaywall({ onPurchased }: Props) {
  const insets = useSafeAreaInsets();
  const { debugInfo } = useSubscription();
  const [showingDiscount, setShowingDiscount] = useState(false);

  useEffect(() => {
    posthog.capture('paywall_shown', { paywall_type: 'hard' });
  }, []);

  const showDiscountPaywall = useCallback(async (trigger: 'close' | 'cancel') => {
    if (showingDiscount) return;
    setShowingDiscount(true);
    try {
      const offerings = await Purchases.getOfferings();
      const discount = offerings.all[DISCOUNT_OFFERING_ID];

      if (discount) {
        posthog.capture('paywall_discount_shown', { trigger });
        const result = await RevenueCatUI.presentPaywall({
          offering: discount,
          displayCloseButton: true,
        });

        if (result === PAYWALL_RESULT.PURCHASED) {
          posthog.capture('paywall_purchased', { source: 'discount' });
          tenjinEvent('paywall_purchased');
          onPurchased?.();
          setShowingDiscount(false);
          return;
        }
        if (result === PAYWALL_RESULT.RESTORED) {
          posthog.capture('paywall_restored', { source: 'discount' });
          tenjinEvent('paywall_restored');
          onPurchased?.();
          setShowingDiscount(false);
          return;
        }
        posthog.capture('paywall_discount_dismissed');
      }
    } catch {}

    setShowingDiscount(false);
  }, [showingDiscount, onPurchased]);

  return (
    <View style={styles.container}>
      {/* Main paywall — inline, no RC close button */}
      <RevenueCatUI.Paywall
        options={{ displayCloseButton: false }}
        onPurchaseCompleted={() => {
          posthog.capture('paywall_purchased', { source: 'main' });
          tenjinEvent('paywall_purchased');
          onPurchased?.();
        }}
        onRestoreCompleted={() => {
          posthog.capture('paywall_restored', { source: 'main' });
          tenjinEvent('paywall_restored');
          onPurchased?.();
        }}
        onPurchaseCancelled={() => {
          posthog.capture('paywall_purchase_cancelled', { source: 'main' });
          // Delay to let Apple payment sheet dismiss before presenting discount modal
          setTimeout(() => showDiscountPaywall('cancel'), 600);
        }}
        onPurchaseError={({ error }: { error: any }) => {
          posthog.capture('paywall_purchase_error', { source: 'main', error: error?.message });
        }}
      />

      {/* DEV buttons */}
      {__DEV__ && (
        <>
          <Pressable
            onPress={async () => {
              await AsyncStorage.removeItem('healmeal_onboarding');
              await AsyncStorage.removeItem('healmeal_onboarding_data');
              DevSettings.reload();
            }}
            style={[styles.devButton, { bottom: insets.bottom + 16 }]}
          >
            <Text style={styles.devButtonText}>Reset Onboarding</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const info = await debugInfo();
              Alert.alert(
                'RevenueCat Debug',
                `User ID: ${info.userId}\n\nisPremium: ${info.isPremium}\n\nActive entitlements: ${info.activeEntitlements.join(', ') || 'none'}\n\nPurchased products: ${info.allPurchasedProducts.join(', ') || 'none'}`,
              );
            }}
            style={[styles.devButton, { bottom: insets.bottom + 52 }]}
          >
            <Text style={styles.devButtonText}>RC Debug Info</Text>
          </Pressable>
        </>
      )}

      {/* Our own X button */}
      <Pressable
        onPress={() => {
          posthog.capture('paywall_close_tapped');
          showDiscountPaywall('close');
        }}
        style={[styles.closeButton, { top: insets.top + 12 }]}
        hitSlop={16}
      >
        {Platform.OS === 'ios' ? (
          <SymbolView
            name={'xmark.circle.fill' as any}
            style={styles.closeIcon}
            tintColor="rgba(150,150,150,0.4)"
          />
        ) : (
          <View style={styles.closeFallback}>
            <View style={styles.closeX} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 999,
    padding: 4,
  },
  closeIcon: {
    width: 22,
    height: 22,
  },
  closeFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(150,150,150,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    width: 12,
    height: 2,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  devButton: {
    position: 'absolute',
    left: 16,
    zIndex: 999,
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
