import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, UserSettings, WeightEntry } from '@/api/types';

const SETTINGS_KEY = 'healmeal_settings';

interface SettingsContextValue {
  settings: UserSettings;
  isLoaded: boolean;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  addWeightEntry: (entry: WeightEntry) => Promise<void>;
  removeWeightEntry: (date: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

async function persistSettings(settings: UserSettings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Silent fail: keep the in-memory state as the source of truth for this session.
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const settingsRef = useRef<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const nextSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
          settingsRef.current = nextSettings;
          setSettings(nextSettings);
        } catch {
          // Corrupted data — use defaults
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const commitSettings = useCallback(async (nextSettings: UserSettings) => {
    settingsRef.current = nextSettings;
    setSettings(nextSettings);
    await persistSettings(nextSettings);
  }, []);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const nextSettings = { ...settingsRef.current, ...updates };
    await commitSettings(nextSettings);
  }, [commitSettings]);

  const addWeightEntry = useCallback(async (entry: WeightEntry) => {
    const filtered = settingsRef.current.weightHistory.filter((e) => e.date !== entry.date);
    const history = [...filtered, entry].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    await commitSettings({
      ...settingsRef.current,
      weightHistory: history,
      currentWeight: entry.weight,
    });
  }, [commitSettings]);

  const removeWeightEntry = useCallback(async (date: string) => {
    const history = settingsRef.current.weightHistory.filter((e) => e.date !== date);
    const lastWeight = history.length > 0 ? history[history.length - 1].weight : 0;
    await commitSettings({
      ...settingsRef.current,
      weightHistory: history,
      currentWeight: lastWeight,
    });
  }, [commitSettings]);

  const value = useMemo(
    () => ({ settings, isLoaded, updateSettings, addWeightEntry, removeWeightEntry }),
    [settings, isLoaded, updateSettings, addWeightEntry, removeWeightEntry]
  );

  return React.createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
