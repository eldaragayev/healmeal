export interface Chain {
  id: string;
  name: string;
  logo: string;
  cuisine: string;
  country: string;
  approximate: boolean;
  website: string;
  mealCount: number;
  deliveryLinks: {
    uberEats?: string;
    deliveroo?: string;
    doordash?: string;
  };
  meals: Meal[];
}

export interface Meal {
  id: number;
  chainId: string;
  name: string;
  category: string;
  photo: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface NearbyMatch {
  chain: Chain;
  distance: number;
  latitude: number;
  longitude: number;
  address: string;
}

export interface UserSettings {
  currentWeight: number;
  goalWeight: number;
  weightHistory: WeightEntry[];
  distanceRadius: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  currentWeight: 81.2,
  goalWeight: 75,
  weightHistory: [
    { date: '2026-02-26', weight: 86.4 },
    { date: '2026-02-27', weight: 86.1 },
    { date: '2026-02-28', weight: 85.7 },
    { date: '2026-03-01', weight: 85.9 },
    { date: '2026-03-02', weight: 85.2 },
    { date: '2026-03-03', weight: 84.8 },
    { date: '2026-03-04', weight: 84.3 },
    { date: '2026-03-05', weight: 84.5 },
    { date: '2026-03-06', weight: 83.9 },
    { date: '2026-03-07', weight: 83.4 },
    { date: '2026-03-08', weight: 83.1 },
    { date: '2026-03-09', weight: 82.8 },
    { date: '2026-03-10', weight: 82.5 },
    { date: '2026-03-11', weight: 82.2 },
    { date: '2026-03-12', weight: 81.9 },
    { date: '2026-03-13', weight: 81.5 },
    { date: '2026-03-14', weight: 81.2 },
  ],
  distanceRadius: 3,
};

export type MealSort = 'calories' | 'protein' | 'fat' | 'carbs' | 'name';

// Protein = highest first, everything else = lowest first
export function getSortOrder(sort: MealSort): 'asc' | 'desc' {
  return sort === 'protein' ? 'desc' : 'asc';
}

export interface Filters {
  maxCalories: number | null;
  minProtein: number | null;
  maxCarbs: number | null;
  maxFat: number | null;
  cuisine: string | null;
  sort: MealSort;
}

export interface MealCategory {
  name: string;
  mealCount: number;
}
