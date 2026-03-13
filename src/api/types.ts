export interface Chain {
  id: string;
  name: string;
  aliases: string[];
  logo: string;
  cuisine: string;
  websiteUrl: string;
  deliveryLinks: {
    uberEats?: string;
    deliveroo?: string;
    doordash?: string;
  };
  meals: Meal[];
}

export interface Meal {
  id: string;
  chainId: string;
  name: string;
  photo: string;
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
  calorieTarget: number;
  highProtein: boolean;
  cuisinePreferences: string[];
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
  calorieTarget: 600,
  highProtein: false,
  cuisinePreferences: [],
  currentWeight: 0,
  goalWeight: 0,
  weightHistory: [],
  distanceRadius: 3,
};

export interface Filters {
  maxCalories: number | null;
  highProtein: boolean;
  lowCarb: boolean;
  lowFat: boolean;
  cuisine: string | null;
}
