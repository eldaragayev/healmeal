import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FETCHED_UPDATE_KEY = 'healmeal_last_fetched_update_id';

/**
 * Checks for OTA updates on app launch.
 * If an update is available, downloads it silently for the next cold launch.
 * No user interruption during startup and no forced reload while the user is opening the app.
 */
export function useOTAUpdate() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    async function checkAndFetch() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;

        const updateId = (update as any).manifest?.id as string | undefined;
        const lastFetched = updateId ? await AsyncStorage.getItem(FETCHED_UPDATE_KEY) : null;
        if (updateId && updateId === lastFetched) return;

        await Updates.fetchUpdateAsync();
        if (updateId) await AsyncStorage.setItem(FETCHED_UPDATE_KEY, updateId);
      } catch {
        // Silent fail — don't disrupt the user experience
      }
    }

    void checkAndFetch();
  }, []);
}
