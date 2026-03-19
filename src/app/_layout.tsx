import { useEffect, useCallback, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostHogProvider } from 'posthog-react-native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useColorScheme } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import * as SplashScreen from 'expo-splash-screen';
import Animated, { FadeOut } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Colors } from '@/constants/theme';
import { FilterProvider } from '@/hooks/useFilters';
import { ModalDataProvider } from '@/hooks/useModalData';
import { LocationProvider } from '@/hooks/useLocation';
import { SettingsProvider, useSettings } from '@/hooks/useSettings';
import { NearbyProvider } from '@/hooks/useNearbyChains';
import { OnboardingProvider, useOnboarding, type OnboardingData } from '@/hooks/useOnboarding';
import { SubscriptionProvider, useSubscription } from '@/hooks/useSubscription';
import { ProfileProvider } from '@/hooks/useProfile';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { HardPaywall } from '@/components/HardPaywall';
import { posthog, useScreenTracking, ONBOARDING_FLOW_VERSION } from '@/analytics';
import { useOTAUpdate } from '@/hooks/useOTAUpdate';
import { useTenjin, tenjinEvent } from '@/hooks/useTenjin';
import { PromptProvider } from '@/utils/prompt';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useScreenTracking();
  useOTAUpdate();
  useTenjin();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PostHogProvider client={posthog} autocapture={{ captureScreens: false, captureTouches: false }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <PromptProvider>
            <SettingsProvider>
              <ProfileProvider>
                <OnboardingProvider>
                  <SubscriptionProvider>
                    <LocationProvider>
                      <RootApp />
                    </LocationProvider>
                  </SubscriptionProvider>
                </OnboardingProvider>
              </ProfileProvider>
            </SettingsProvider>
          </PromptProvider>
        </ThemeProvider>
      </PostHogProvider>
    </GestureHandlerRootView>
  );
}

function RootApp() {
  const colorScheme = useColorScheme();
  const { settings, isLoaded, updateSettings } = useSettings();
  const { isOnboarded, complete: completeOnboarding } = useOnboarding();
  const { isPremium } = useSubscription();
  const [showSplash, setShowSplash] = useState(true);

  const onReady = useCallback(async () => {
    if (isLoaded && isOnboarded !== null && isPremium !== null) {
      await SplashScreen.hideAsync().catch(() => {});
      setTimeout(() => setShowSplash(false), 800);
    }
  }, [isLoaded, isOnboarded, isPremium]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  const handleOnboardingComplete = useCallback(async (data: OnboardingData) => {
    // Save onboarding weight data into app settings
    const weightKg = data.weightUnit === 'lb'
      ? +(data.currentWeight * 0.453592).toFixed(1)
      : data.currentWeight;
    const goalKg = data.weightUnit === 'lb'
      ? +(data.goalWeight * 0.453592).toFixed(1)
      : data.goalWeight;

    await updateSettings({
      currentWeight: weightKg,
      goalWeight: goalKg,
      weightHistory: [{ date: new Date().toISOString().split('T')[0], weight: weightKg }],
    });

    tenjinEvent('onboarding_completed');
    posthog.capture('onboarding_completed', {
      flow_version: ONBOARDING_FLOW_VERSION,
      goal: data.goal,
      weight_unit: data.weightUnit,
      dining_frequency: data.diningFrequency,
      restaurants_selected: data.selectedRestaurants.length,
      attribution: data.attribution,
      $set: {
        name: data.name,
        goal: data.goal,
        weight_unit: data.weightUnit,
        age_range: data.ageRange,
        dining_frequency: data.diningFrequency,
        dietary_restrictions: data.dietaryRestrictions,
        onboarding_flow_version: ONBOARDING_FLOW_VERSION,
      },
      $set_once: {
        initial_weight_kg: weightKg,
        initial_goal_weight_kg: goalKg,
        onboarded_at: new Date().toISOString(),
        attribution: data.attribution,
      },
    });

    await completeOnboarding(data);
  }, [updateSettings, completeOnboarding]);

  return (
    <NearbyProvider radiusMiles={settings.distanceRadius}>
      <FilterProvider>
        <ModalDataProvider>
          <StatusBar style="auto" />
          {isOnboarded === false ? (
            <OnboardingFlow onComplete={handleOnboardingComplete} />
          ) : (
            <AppTabsWithPaywall isPremium={isPremium} />
          )}
          {showSplash && (
            <Animated.View
              exiting={FadeOut.duration(400)}
              style={[
                splash.overlay,
                { backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background },
              ]}
            >
              <Image
                source={require('@/../assets/animation/loading.webp')}
                style={splash.mascot}
                autoplay
              />
            </Animated.View>
          )}
        </ModalDataProvider>
      </FilterProvider>
    </NearbyProvider>
  );
}

const splash = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  mascot: {
    width: 100,
    height: 100,
  },
});

function AppTabsWithPaywall({ isPremium }: { isPremium: boolean | null }) {
  // Still loading premium status — show nothing (splash covers it)
  if (isPremium === null) return null;
  // Not premium — hard paywall
  if (isPremium === false) return <HardPaywall />;
  // Premium — full app
  return <AppTabs />;
}

function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      iconColor={{ default: colors.textTertiary, selected: colors.brandGreen }}
    >
      <NativeTabs.Trigger name="(restaurants)">
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
        <NativeTabs.Trigger.Label>Meals</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
