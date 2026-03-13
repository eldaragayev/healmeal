import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, UserSettings, WeightEntry } from '@/api/types';

const SETTINGS_KEY = 'healmeal_settings';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        } catch {
          // Corrupted data — use defaults
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      const next = { ...settings, ...updates };
      setSettings(next);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    },
    [settings]
  );

  const addWeightEntry = useCallback(
    async (entry: WeightEntry) => {
      const history = [...settings.weightHistory, entry].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      await updateSettings({ weightHistory: history, currentWeight: entry.weight });
    },
    [settings.weightHistory, updateSettings]
  );

  const removeWeightEntry = useCallback(
    async (date: string) => {
      const history = settings.weightHistory.filter((e) => e.date !== date);
      const lastWeight = history.length > 0 ? history[history.length - 1].weight : 0;
      await updateSettings({ weightHistory: history, currentWeight: lastWeight });
    },
    [settings.weightHistory, updateSettings]
  );

  return { settings, isLoaded, updateSettings, addWeightEntry, removeWeightEntry };
}
