import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { posthog } from '@/analytics';

const IOS_API_KEY = 'appl_ovFkqWKcaBntZjIpyqineKijOGk';
const ENTITLEMENT_ID = 'pro';

let configured = false;

interface SubscriptionDebugInfo {
  userId: string;
  isPremium: boolean;
  activeEntitlements: string[];
  allPurchasedProducts: string[];
}

interface SubscriptionContextValue {
  isPremium: boolean | null;
  debugInfo: () => Promise<SubscriptionDebugInfo>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function getHasAccess(info: CustomerInfo) {
  return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

async function syncSubscriptionAnalytics(isPremium: boolean) {
  const status = isPremium ? 'active' : 'free';
  posthog.register({ subscription_status: status });
  try {
    const distinctId = await posthog.getDistinctId();
    posthog.identify(distinctId, {
      $set: { subscription_status: status },
    });
  } catch {
    // Analytics identity sync should never block subscription state.
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : null;
        if (!apiKey) {
          if (__DEV__) {
            console.warn('[RevenueCat] No API key configured for this platform.');
          }
          await syncSubscriptionAnalytics(false);
          if (isMounted) setIsPremium(false);
          return;
        }

        if (!configured) {
          Purchases.setLogLevel(__DEV__ ? Purchases.LOG_LEVEL.WARN : Purchases.LOG_LEVEL.ERROR);
          Purchases.configure({ apiKey });
          configured = true;
        }

        const info = await Purchases.getCustomerInfo();

        try {
          const distinctId = await posthog.getDistinctId();
          Purchases.setAttributes({ $posthogDistinctId: distinctId });
        } catch {
          // Attribution linkage should never block startup.
        }

        const hasAccess = getHasAccess(info);

        await syncSubscriptionAnalytics(hasAccess);
        if (isMounted) setIsPremium(hasAccess);
      } catch (error: any) {
        posthog.capture('subscription_init_failed', {
          error: error?.message ?? 'unknown',
        });
        await syncSubscriptionAnalytics(false);
        if (isMounted) setIsPremium(false);
      }
    };

    void init();

    const listener = (info: CustomerInfo) => {
      const hasAccess = getHasAccess(info);
      void syncSubscriptionAnalytics(hasAccess);
      setIsPremium((prev) => {
        const newStatus = hasAccess ? 'active' : 'free';
        if (prev !== null && prev !== hasAccess) {
          posthog.capture('subscription_status_changed', {
            old_status: prev ? 'active' : 'free',
            new_status: newStatus,
            $set: { subscription_status: newStatus },
          });
        }
        return hasAccess;
      });
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      isMounted = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const debugInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      return {
        userId: info.originalAppUserId,
        isPremium: getHasAccess(info),
        activeEntitlements: Object.keys(info.entitlements.active),
        allPurchasedProducts: info.allPurchasedProductIdentifiers,
      };
    } catch {
      return {
        userId: 'unavailable',
        isPremium: false,
        activeEntitlements: [],
        allPurchasedProducts: [],
      };
    }
  }, []);

  const value = useMemo(
    () => ({ isPremium, debugInfo }),
    [isPremium, debugInfo]
  );

  return React.createElement(SubscriptionContext.Provider, { value }, children);
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
