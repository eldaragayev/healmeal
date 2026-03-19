import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'healmeal_onboarding';

export interface OnboardingData {
  name: string;
  attribution: string | null;
  goal: 'lose' | 'muscle' | 'balanced' | null;
  currentWeight: number;
  goalWeight: number;
  goalWeightManuallyEdited: boolean;
  weightUnit: 'lb' | 'kg';
  heightFeet: number;
  heightInches: number;
  heightCm: number;
  heightUnit: 'ft' | 'cm';
  ageRange: string | null;
  diningFrequency: number;
  selectedRestaurants: string[];
  dietaryRestrictions: string[];
}

export interface StepProps {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

export const INITIAL_DATA: OnboardingData = {
  name: '',
  attribution: null,
  goal: null,
  currentWeight: 170,
  goalWeight: 155,
  goalWeightManuallyEdited: false,
  weightUnit: 'lb',
  heightFeet: 5,
  heightInches: 10,
  heightCm: 178,
  heightUnit: 'ft',
  ageRange: null,
  diningFrequency: 4,
  selectedRestaurants: [],
  dietaryRestrictions: [],
};

interface OnboardingContextValue {
  isOnboarded: boolean | null;
  complete: (data: OnboardingData) => Promise<void>;
  reset: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => setIsOnboarded(value === 'true'))
      .catch(() => setIsOnboarded(false));
  }, []);

  const complete = useCallback(async (data: OnboardingData) => {
    await AsyncStorage.multiSet([
      [STORAGE_KEY, 'true'],
      [`${STORAGE_KEY}_data`, JSON.stringify(data)],
    ]);
    setIsOnboarded(true);
  }, []);

  const reset = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEY, `${STORAGE_KEY}_data`]);
    setIsOnboarded(false);
  }, []);

  const value = useMemo(
    () => ({ isOnboarded, complete, reset }),
    [isOnboarded, complete, reset]
  );

  return React.createElement(OnboardingContext.Provider, { value }, children);
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
