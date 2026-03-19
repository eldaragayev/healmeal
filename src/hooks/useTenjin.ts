import { useEffect } from 'react';
import { Platform } from 'react-native';
import Tenjin from 'react-native-tenjin';

const TENJIN_API_KEY = '4VFWCDADJYJ5NCIFGEV3MIDNVNQLPFVY';

let initialized = false;

/**
 * Initializes Tenjin attribution SDK.
 * On iOS: requests ATT permission first, then connects.
 * On Android: connects immediately.
 */
export function useTenjin() {
  useEffect(() => {
    if (initialized) return;
    let cancelled = false;

    async function init() {
      try {
        Tenjin.initialize(TENJIN_API_KEY);
        if (Platform.OS === 'ios') {
          // Import dynamically to avoid Android issues
          try {
            const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
            await requestTrackingPermissionsAsync();
          } catch {
            // If ATT can't be requested, still allow Tenjin to connect without IDFA.
          }
        }

        if (cancelled) return;
        Tenjin.connect();
        initialized = true;
      } catch {
        initialized = false;
        // Silent fail — attribution is non-critical
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);
}

/**
 * Track a named event in Tenjin (for ad network postbacks).
 * Call this for key conversion events: onboarding_completed, paywall_purchased, etc.
 */
export function tenjinEvent(name: string) {
  try {
    Tenjin.eventWithName(name);
  } catch {}
}

/**
 * Track a named event with a numeric value (for revenue events).
 */
export function tenjinEventWithValue(name: string, value: number) {
  try {
    Tenjin.eventWithNameAndValue(name, value);
  } catch {}
}
