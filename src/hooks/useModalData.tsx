import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Meal, NearbyMatch } from '@/api/types';
import { type MealCombo } from '@/api/client';

interface ModalDataRef {
  meal: Meal | null;
  match: NearbyMatch | null;
  restaurantMatch: NearbyMatch | null;
  combo: MealCombo | null;
  comboMatch: NearbyMatch | null;
  pendingSearch: string | null;
}

interface ModalDataContextValue {
  getMeal: () => { meal: Meal | null; match: NearbyMatch | null };
  setMeal: (meal: Meal, match: NearbyMatch) => void;
  getRestaurant: () => NearbyMatch | null;
  setRestaurant: (match: NearbyMatch) => void;
  getCombo: () => { combo: MealCombo | null; match: NearbyMatch | null };
  setCombo: (combo: MealCombo, match: NearbyMatch) => void;
  getPendingSearch: () => string | null;
  setPendingSearch: (query: string) => void;
}

const ModalDataContext = createContext<ModalDataContextValue | null>(null);

export function ModalDataProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<ModalDataRef>({ meal: null, match: null, restaurantMatch: null, combo: null, comboMatch: null, pendingSearch: null });

  const setMeal = useCallback((meal: Meal, match: NearbyMatch) => {
    ref.current.meal = meal;
    ref.current.match = match;
  }, []);

  const getMeal = useCallback(() => ({
    meal: ref.current.meal,
    match: ref.current.match,
  }), []);

  const setRestaurant = useCallback((match: NearbyMatch) => {
    ref.current.restaurantMatch = match;
  }, []);

  const getRestaurant = useCallback(() => ref.current.restaurantMatch, []);

  const setCombo = useCallback((combo: MealCombo, match: NearbyMatch) => {
    ref.current.combo = combo;
    ref.current.comboMatch = match;
  }, []);

  const getCombo = useCallback(() => ({
    combo: ref.current.combo,
    match: ref.current.comboMatch,
  }), []);

  const setPendingSearch = useCallback((query: string) => {
    ref.current.pendingSearch = query;
  }, []);

  const getPendingSearch = useCallback(() => {
    const q = ref.current.pendingSearch;
    ref.current.pendingSearch = null; // consume once
    return q;
  }, []);

  return (
    <ModalDataContext value={{ getMeal, setMeal, getRestaurant, setRestaurant, getCombo, setCombo, getPendingSearch, setPendingSearch }}>
      {children}
    </ModalDataContext>
  );
}

export function useModalData() {
  const ctx = useContext(ModalDataContext);
  if (!ctx) throw new Error('useModalData must be used within ModalDataProvider');
  return ctx;
}
