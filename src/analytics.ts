import PostHog from 'posthog-react-native';
import { useEffect } from 'react';
import { usePathname } from 'expo-router';

export const posthog = new PostHog('phc_d6TWvzLSWcTPa7vJLdXLyx50VKSFyoXYOvULTQDfL22', {
  host: 'https://eu.i.posthog.com',
  enableSessionReplay: true,
  captureAppLifecycleEvents: true,
  personProfiles: 'always',
  sessionReplayConfig: {
    maskAllTextInputs: true,
    maskAllImages: false,
  },
});

/** Track screen views from Expo Router pathname changes */
export function useScreenTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      posthog.screen(pathname);
    }
  }, [pathname]);
}

/** Stable identifier for the current onboarding analytics schema. */
export const ONBOARDING_FLOW_VERSION = 'step_registry_v3';
