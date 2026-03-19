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
import { useSettings } from './useSettings';
import { clearRecommendationCache, clearFeedCache } from '@/api/client';

const ONBOARDING_DATA_KEY = 'healmeal_onboarding_data';

export type Goal = 'lose' | 'muscle' | 'balanced';

export const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Lose weight',
  muscle: 'Build muscle',
  balanced: 'Stay balanced',
};

export const DIETARY_OPTIONS = [
  { label: 'Vegetarian', icon: 'leaf.fill' },
  { label: 'Vegan', icon: 'leaf.fill' },
  { label: 'Gluten-free', icon: 'xmark.circle.fill' },
  { label: 'Dairy-free', icon: 'drop.fill' },
  { label: 'Keto', icon: 'flame.fill' },
  { label: 'No pork', icon: 'xmark.circle.fill' },
  { label: 'No shellfish', icon: 'xmark.circle.fill' },
  { label: 'Nut-free', icon: 'xmark.circle.fill' },
] as const;

export interface ProfileData {
  name: string;
  goal: Goal | null;
  dietaryRestrictions: string[];
  ageRange: string | null;
  heightFeet: number;
  heightInches: number;
  heightCm: number;
  heightUnit: 'ft' | 'cm';
  diningFrequency: number;
  currentWeight: number;
  goalWeight: number;
}

interface ProfileContextValue {
  profile: ProfileData;
  description: string;
  getDescriptionWithTime: () => string;
  isLoaded: boolean;
  updateGoal: (goal: Goal) => Promise<void>;
  updateDietaryRestrictions: (restrictions: string[]) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateHeight: (height: { feet?: number; inches?: number; cm?: number; unit?: 'ft' | 'cm' }) => Promise<void>;
  updateDiningFrequency: (freq: number) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [onboardingData, setOnboardingData] = useState<Record<string, any> | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const dataRef = useRef<Record<string, any> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DATA_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            dataRef.current = parsed;
            setOnboardingData(parsed);
          } catch {}
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const profile: ProfileData = useMemo(() => ({
    name: (onboardingData?.name as string) ?? '',
    goal: (onboardingData?.goal as Goal) ?? null,
    dietaryRestrictions: (onboardingData?.dietaryRestrictions as string[] ?? []).filter(
      (r) => r !== 'None of these',
    ),
    ageRange: (onboardingData?.ageRange as string) ?? null,
    heightFeet: (onboardingData?.heightFeet as number) ?? 5,
    heightInches: (onboardingData?.heightInches as number) ?? 10,
    heightCm: (onboardingData?.heightCm as number) ?? 178,
    heightUnit: (onboardingData?.heightUnit as 'ft' | 'cm') ?? 'cm',
    diningFrequency: (onboardingData?.diningFrequency as number) ?? 4,
    currentWeight: settings.currentWeight,
    goalWeight: settings.goalWeight,
  }), [onboardingData, settings.currentWeight, settings.goalWeight]);

  const description = useMemo(() => {
    const parts: string[] = [];

    if (profile.ageRange) parts.push(profile.ageRange);

    // Height
    if (profile.heightUnit === 'ft') {
      parts.push(`${profile.heightFeet}'${profile.heightInches}"`);
    } else if (profile.heightCm > 0) {
      parts.push(`${profile.heightCm}cm`);
    }

    if (profile.goal) {
      const goalText: Record<Goal, string> = {
        lose: 'losing weight',
        muscle: 'building muscle',
        balanced: 'eating balanced',
      };
      parts.push(goalText[profile.goal]);
    }

    if (profile.currentWeight > 0 && profile.goalWeight > 0) {
      parts.push(`${profile.currentWeight}kg → ${profile.goalWeight}kg`);
    }

    if (profile.diningFrequency > 0) {
      parts.push(`dines out ${profile.diningFrequency}x/week`);
    }

    if (profile.dietaryRestrictions.length > 0) {
      parts.push(profile.dietaryRestrictions.join(', '));
    } else {
      parts.push('no dietary restrictions');
    }

    return parts.join(', ');
  }, [profile]);

  /**
   * Build a time-aware description for the recommendations API.
   * Call this at request time (not in a memo) so the time is always fresh.
   */
  const getDescriptionWithTime = useCallback(() => {
    const hour = new Date().getHours();
    let mealTime: string;
    if (hour < 11) mealTime = 'breakfast time';
    else if (hour < 15) mealTime = 'lunch time';
    else if (hour < 17) mealTime = 'afternoon snack time';
    else mealTime = 'dinner time';

    return `${description}, ${mealTime} (${hour}:${String(new Date().getMinutes()).padStart(2, '0')} local)`;
  }, [description]);

  const persistOnboardingData = useCallback(async (updates: Record<string, any>) => {
    const current = dataRef.current ?? {};
    const next = { ...current, ...updates };
    dataRef.current = next;
    setOnboardingData(next);
    await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(next));
    clearRecommendationCache();
    clearFeedCache();
  }, []);

  const updateGoal = useCallback(async (goal: Goal) => {
    await persistOnboardingData({ goal });
  }, [persistOnboardingData]);

  const updateDietaryRestrictions = useCallback(async (restrictions: string[]) => {
    await persistOnboardingData({ dietaryRestrictions: restrictions });
  }, [persistOnboardingData]);

  const updateName = useCallback(async (name: string) => {
    await persistOnboardingData({ name });
  }, [persistOnboardingData]);

  const updateHeight = useCallback(async (height: { feet?: number; inches?: number; cm?: number; unit?: 'ft' | 'cm' }) => {
    const updates: Record<string, any> = {};
    if (height.feet != null) updates.heightFeet = height.feet;
    if (height.inches != null) updates.heightInches = height.inches;
    if (height.cm != null) updates.heightCm = height.cm;
    if (height.unit != null) updates.heightUnit = height.unit;
    await persistOnboardingData(updates);
  }, [persistOnboardingData]);

  const updateDiningFrequency = useCallback(async (freq: number) => {
    await persistOnboardingData({ diningFrequency: freq });
  }, [persistOnboardingData]);

  const value = useMemo(
    () => ({ profile, description, getDescriptionWithTime, isLoaded, updateGoal, updateDietaryRestrictions, updateName, updateHeight, updateDiningFrequency }),
    [profile, description, getDescriptionWithTime, isLoaded, updateGoal, updateDietaryRestrictions, updateName, updateHeight, updateDiningFrequency],
  );

  return React.createElement(ProfileContext.Provider, { value }, children);
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
