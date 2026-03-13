# HealMeal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-tab Expo mobile app (Restaurants + Settings) that shows nearby chain restaurants with their healthiest meals, filtered by calories/protein/cuisine.

**Architecture:** Expo SDK 55 with Expo Router v55 native bottom tabs. Mock API returns pre-matched restaurant data. Settings stored locally via AsyncStorage. Liquid Glass via `expo-glass-effect` on iOS 26, graceful fallback elsewhere.

**Tech Stack:** Expo SDK 55, React Native 0.83, React 19.2, Expo Router v55, expo-glass-effect, @gorhom/bottom-sheet, react-native-maps, expo-location, AsyncStorage

**Spec:** `docs/superpowers/specs/2026-03-13-healmeal-design.md`

---

## Chunk 1: Project Setup & Foundation

### Task 1: Scaffold Expo Project

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `app/` directory (all via template)

- [ ] **Step 1: Create Expo project in temp directory and move into project root**

```bash
cd /Users/eldaragayev
npx create-expo-app@latest healmeal-temp --template default@sdk-55
```

- [ ] **Step 2: Move generated files into project root (preserve existing docs/ and .git/)**

```bash
cd /Users/eldaragayev
# Move all files from temp into the project
# rsync to include dotfiles, exclude .git to preserve existing repo
rsync -a --exclude='.git' healmeal-temp/ healmeal-1/
rm -rf healmeal-temp
```

Merge any new entries from the template's `.gitignore` into the existing one. Ensure `.superpowers/` remains in `.gitignore`.

- [ ] **Step 3: Verify project runs**

```bash
cd /Users/eldaragayev/healmeal-1
npx expo start --no-dev --minify 2>&1 | head -20
```

Expected: Expo dev server starts without errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo SDK 55 project"
```

---

### Task 2: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install all required packages**

```bash
npx expo install expo-glass-effect expo-location react-native-maps @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated @react-native-async-storage/async-storage @react-native-community/slider react-native-safe-area-context react-native-svg victory-native
```

- [ ] **Step 2: Configure expo-location plugin in app.json**

Add to `app.json` under `expo.plugins`:

```json
[
  "expo-location",
  {
    "locationWhenInUsePermission": "Allow HealMeal to find restaurants near you.",
    "isIosBackgroundLocationEnabled": false,
    "isAndroidBackgroundLocationEnabled": false
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add package.json app.json
git commit -m "chore: install dependencies"
```

---

### Task 3: Create Theme Constants

**Files:**
- Create: `constants/theme.ts`

- [ ] **Step 1: Create the theme file**

```typescript
// constants/theme.ts
import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    background: '#f2f5f0',
    surface: 'rgba(255,255,255,0.65)',
    surfaceBorder: 'rgba(255,255,255,0.8)',
    text: '#1a1a1a',
    textSecondary: '#888',
    textTertiary: '#999',
    brandGreen: '#16a34a',
    protein: '#16a34a',
    carbs: '#3b82f6',
    fat: '#f59e0b',
    proteinBg: '#f0fdf4',
    carbsBg: '#eff6ff',
    fatBg: '#fefce8',
    chipActive: 'rgba(22,163,74,0.12)',
    chipActiveBorder: 'rgba(22,163,74,0.3)',
    chipInactive: 'rgba(255,255,255,0.7)',
    chipInactiveBorder: 'rgba(0,0,0,0.06)',
    chipInactiveText: '#555',
  },
  dark: {
    background: '#0a0a0a',
    surface: 'rgba(255,255,255,0.06)',
    surfaceBorder: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textSecondary: '#888',
    textTertiary: '#666',
    brandGreen: '#4ade80',
    protein: '#4ade80',
    carbs: '#60a5fa',
    fat: '#fbbf24',
    proteinBg: 'rgba(74,222,128,0.1)',
    carbsBg: 'rgba(96,165,250,0.1)',
    fatBg: 'rgba(251,191,36,0.1)',
    chipActive: 'rgba(74,222,128,0.15)',
    chipActiveBorder: 'rgba(74,222,128,0.3)',
    chipInactive: 'rgba(255,255,255,0.06)',
    chipInactiveBorder: 'rgba(255,255,255,0.08)',
    chipInactiveText: '#999',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
} as const;

export const Typography = {
  title: {
    fontSize: 34,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  macro: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
} as const;

export function useThemeColors() {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
```

- [ ] **Step 2: Commit**

```bash
git add constants/theme.ts
git commit -m "feat: add theme constants with light/dark color tokens"
```

---

### Task 4: Create TypeScript Types & Default Settings

**Files:**
- Create: `api/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// api/types.ts

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
  cuisine: string | null;
}
```

- [ ] **Step 2: Commit**

```bash
git add api/types.ts
git commit -m "feat: add TypeScript types and default settings"
```

---

## Chunk 2: Data Layer & Hooks

### Task 5: Create Mock Data

**Files:**
- Create: `api/mock-data.ts`

- [ ] **Step 1: Create realistic mock chain/meal data**

```typescript
// api/mock-data.ts
import { NearbyMatch } from './types';

export const MOCK_NEARBY: NearbyMatch[] = [
  {
    chain: {
      id: 'nandos',
      name: "Nando's",
      aliases: ["Nando's Peri-Peri", 'Nandos'],
      logo: 'https://logo.clearbit.com/nandos.co.uk',
      cuisine: 'Chicken',
      websiteUrl: 'https://www.nandos.co.uk',
      deliveryLinks: {
        uberEats: 'https://www.ubereats.com/store/nandos',
        deliveroo: 'https://deliveroo.co.uk/menu/nandos',
      },
      meals: [
        {
          id: 'n1',
          chainId: 'nandos',
          name: 'Grilled Chicken Breast',
          photo: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400',
          calories: 380,
          protein: 42,
          carbs: 12,
          fat: 14,
        },
        {
          id: 'n2',
          chainId: 'nandos',
          name: 'Supergrain Salad',
          photo: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
          calories: 290,
          protein: 18,
          carbs: 35,
          fat: 8,
        },
        {
          id: 'n3',
          chainId: 'nandos',
          name: 'Chicken Wrap',
          photo: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400',
          calories: 420,
          protein: 32,
          carbs: 28,
          fat: 16,
        },
        {
          id: 'n4',
          chainId: 'nandos',
          name: 'Butterfly Chicken',
          photo: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400',
          calories: 340,
          protein: 52,
          carbs: 2,
          fat: 12,
        },
      ],
    },
    distance: 0.3,
    latitude: 51.5074,
    longitude: -0.1278,
    address: '123 High Street, London',
  },
  {
    chain: {
      id: 'pizzaexpress',
      name: 'Pizza Express',
      aliases: ['PizzaExpress'],
      logo: 'https://logo.clearbit.com/pizzaexpress.com',
      cuisine: 'Italian',
      websiteUrl: 'https://www.pizzaexpress.com',
      deliveryLinks: {
        uberEats: 'https://www.ubereats.com/store/pizza-express',
        deliveroo: 'https://deliveroo.co.uk/menu/pizza-express',
      },
      meals: [
        {
          id: 'pe1',
          chainId: 'pizzaexpress',
          name: 'Leggera Margherita',
          photo: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
          calories: 340,
          protein: 14,
          carbs: 42,
          fat: 10,
        },
        {
          id: 'pe2',
          chainId: 'pizzaexpress',
          name: 'Nicoise Salad',
          photo: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
          calories: 260,
          protein: 22,
          carbs: 18,
          fat: 12,
        },
        {
          id: 'pe3',
          chainId: 'pizzaexpress',
          name: 'Pollo Forza',
          photo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
          calories: 480,
          protein: 36,
          carbs: 48,
          fat: 14,
        },
      ],
    },
    distance: 0.7,
    latitude: 51.5094,
    longitude: -0.1338,
    address: '45 Baker Street, London',
  },
  {
    chain: {
      id: 'wagamama',
      name: "Wagamama",
      aliases: ['wagamama'],
      logo: 'https://logo.clearbit.com/wagamama.com',
      cuisine: 'Japanese',
      websiteUrl: 'https://www.wagamama.com',
      deliveryLinks: {
        uberEats: 'https://www.ubereats.com/store/wagamama',
        deliveroo: 'https://deliveroo.co.uk/menu/wagamama',
      },
      meals: [
        {
          id: 'w1',
          chainId: 'wagamama',
          name: 'Chicken Katsu Curry',
          photo: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
          calories: 580,
          protein: 34,
          carbs: 64,
          fat: 18,
        },
        {
          id: 'w2',
          chainId: 'wagamama',
          name: 'Grilled Chicken Ramen',
          photo: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400',
          calories: 420,
          protein: 38,
          carbs: 40,
          fat: 10,
        },
        {
          id: 'w3',
          chainId: 'wagamama',
          name: 'Yasai Pad Thai',
          photo: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400',
          calories: 350,
          protein: 12,
          carbs: 52,
          fat: 8,
        },
      ],
    },
    distance: 1.2,
    latitude: 51.5134,
    longitude: -0.1398,
    address: '78 Regent Street, London',
  },
  {
    chain: {
      id: 'leon',
      name: 'LEON',
      aliases: ['Leon', 'LEON Naturally Fast Food'],
      logo: 'https://logo.clearbit.com/leon.co',
      cuisine: 'Mediterranean',
      websiteUrl: 'https://leon.co',
      deliveryLinks: {
        uberEats: 'https://www.ubereats.com/store/leon',
        deliveroo: 'https://deliveroo.co.uk/menu/leon',
      },
      meals: [
        {
          id: 'l1',
          chainId: 'leon',
          name: 'Grilled Chicken LOVe Box',
          photo: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          calories: 410,
          protein: 38,
          carbs: 32,
          fat: 14,
        },
        {
          id: 'l2',
          chainId: 'leon',
          name: 'Salmon Fillet Box',
          photo: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
          calories: 380,
          protein: 30,
          carbs: 28,
          fat: 16,
        },
        {
          id: 'l3',
          chainId: 'leon',
          name: 'Vegan Meatball Hot Box',
          photo: 'https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=400',
          calories: 320,
          protein: 16,
          carbs: 42,
          fat: 10,
        },
      ],
    },
    distance: 1.8,
    latitude: 51.5154,
    longitude: -0.1418,
    address: '22 Oxford Street, London',
  },
  {
    chain: {
      id: 'chipotle',
      name: 'Chipotle',
      aliases: ['Chipotle Mexican Grill'],
      logo: 'https://logo.clearbit.com/chipotle.com',
      cuisine: 'Mexican',
      websiteUrl: 'https://www.chipotle.com',
      deliveryLinks: {
        uberEats: 'https://www.ubereats.com/store/chipotle',
        doordash: 'https://www.doordash.com/store/chipotle',
      },
      meals: [
        {
          id: 'c1',
          chainId: 'chipotle',
          name: 'Chicken Burrito Bowl',
          photo: 'https://images.unsplash.com/photo-1623653387945-2fd25214f8fc?w=400',
          calories: 510,
          protein: 46,
          carbs: 40,
          fat: 18,
        },
        {
          id: 'c2',
          chainId: 'chipotle',
          name: 'Sofritas Salad',
          photo: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
          calories: 350,
          protein: 18,
          carbs: 30,
          fat: 16,
        },
        {
          id: 'c3',
          chainId: 'chipotle',
          name: 'Steak Tacos (3)',
          photo: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
          calories: 450,
          protein: 40,
          carbs: 36,
          fat: 14,
        },
      ],
    },
    distance: 2.4,
    latitude: 51.5174,
    longitude: -0.1438,
    address: '55 Tottenham Court Road, London',
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add api/mock-data.ts
git commit -m "feat: add mock restaurant/meal data for 5 chains"
```

---

### Task 6: Create API Client

**Files:**
- Create: `api/client.ts`

- [ ] **Step 1: Create the mock API client**

```typescript
// api/client.ts
import { NearbyMatch } from './types';
import { MOCK_NEARBY } from './mock-data';

// Simulates a network request — swap this implementation when backend is ready
export async function getNearbyRestaurants(
  _lat: number,
  _lng: number,
  radiusMiles: number
): Promise<NearbyMatch[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Filter by radius (mock data has distances baked in)
  return MOCK_NEARBY.filter((match) => match.distance <= radiusMiles).sort(
    (a, b) => a.distance - b.distance
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add api/client.ts
git commit -m "feat: add mock API client for nearby restaurants"
```

---

### Task 7: Create Filter Utility

**Files:**
- Create: `utils/filters.ts`

- [ ] **Step 1: Create filtering logic**

```typescript
// utils/filters.ts
import { Filters, Meal, NearbyMatch } from '../api/types';

export function filterMeals(meals: Meal[], filters: Filters): Meal[] {
  return meals.filter((meal) => {
    if (filters.maxCalories !== null && meal.calories > filters.maxCalories) {
      return false;
    }
    if (filters.highProtein && meal.protein < 30) {
      return false;
    }
    return true;
  });
}

export function filterRestaurants(
  matches: NearbyMatch[],
  filters: Filters
): NearbyMatch[] {
  return matches
    .filter((match) => {
      // Filter by cuisine
      if (filters.cuisine && match.chain.cuisine !== filters.cuisine) {
        return false;
      }
      // Hide restaurant if no meals pass filters
      const filtered = filterMeals(match.chain.meals, filters);
      return filtered.length > 0;
    });
}

export function getUniqueCuisines(matches: NearbyMatch[]): string[] {
  const cuisines = new Set(matches.map((m) => m.chain.cuisine));
  return Array.from(cuisines).sort();
}
```

- [ ] **Step 2: Write tests for filtering logic**

Create: `utils/__tests__/filters.test.ts`

```typescript
// utils/__tests__/filters.test.ts
import { filterMeals, filterRestaurants, getUniqueCuisines } from '../filters';
import { Meal, NearbyMatch, Filters } from '../../api/types';

const mockMeals: Meal[] = [
  { id: '1', chainId: 'a', name: 'Low Cal', photo: '', calories: 300, protein: 20, carbs: 30, fat: 10 },
  { id: '2', chainId: 'a', name: 'High Protein', photo: '', calories: 400, protein: 45, carbs: 20, fat: 15 },
  { id: '3', chainId: 'a', name: 'High Cal', photo: '', calories: 700, protein: 35, carbs: 60, fat: 30 },
];

describe('filterMeals', () => {
  it('returns all meals when no filters active', () => {
    const filters: Filters = { maxCalories: null, highProtein: false, cuisine: null };
    expect(filterMeals(mockMeals, filters)).toHaveLength(3);
  });

  it('filters by max calories', () => {
    const filters: Filters = { maxCalories: 500, highProtein: false, cuisine: null };
    const result = filterMeals(mockMeals, filters);
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.calories <= 500)).toBe(true);
  });

  it('filters by high protein (>= 30g)', () => {
    const filters: Filters = { maxCalories: null, highProtein: true, cuisine: null };
    const result = filterMeals(mockMeals, filters);
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.protein >= 30)).toBe(true);
  });

  it('combines calorie and protein filters', () => {
    const filters: Filters = { maxCalories: 500, highProtein: true, cuisine: null };
    const result = filterMeals(mockMeals, filters);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('High Protein');
  });
});

describe('filterRestaurants', () => {
  const mockMatches: NearbyMatch[] = [
    {
      chain: { id: 'a', name: 'ChickenPlace', aliases: [], logo: '', cuisine: 'Chicken', websiteUrl: '', deliveryLinks: {}, meals: mockMeals },
      distance: 0.5, latitude: 0, longitude: 0, address: '',
    },
    {
      chain: { id: 'b', name: 'PastaPlace', aliases: [], logo: '', cuisine: 'Italian', websiteUrl: '', deliveryLinks: {}, meals: [mockMeals[2]] },
      distance: 1.0, latitude: 0, longitude: 0, address: '',
    },
  ];

  it('filters by cuisine', () => {
    const filters: Filters = { maxCalories: null, highProtein: false, cuisine: 'Italian' };
    const result = filterRestaurants(mockMatches, filters);
    expect(result).toHaveLength(1);
    expect(result[0].chain.name).toBe('PastaPlace');
  });

  it('hides restaurant when all meals filtered out', () => {
    const filters: Filters = { maxCalories: 200, highProtein: false, cuisine: null };
    const result = filterRestaurants(mockMatches, filters);
    expect(result).toHaveLength(0);
  });
});

describe('getUniqueCuisines', () => {
  it('returns sorted unique cuisines', () => {
    const matches: NearbyMatch[] = [
      { chain: { id: '1', name: '', aliases: [], logo: '', cuisine: 'Japanese', websiteUrl: '', deliveryLinks: {}, meals: [] }, distance: 0, latitude: 0, longitude: 0, address: '' },
      { chain: { id: '2', name: '', aliases: [], logo: '', cuisine: 'Chicken', websiteUrl: '', deliveryLinks: {}, meals: [] }, distance: 0, latitude: 0, longitude: 0, address: '' },
      { chain: { id: '3', name: '', aliases: [], logo: '', cuisine: 'Chicken', websiteUrl: '', deliveryLinks: {}, meals: [] }, distance: 0, latitude: 0, longitude: 0, address: '' },
    ];
    expect(getUniqueCuisines(matches)).toEqual(['Chicken', 'Japanese']);
  });
});
```

- [ ] **Step 3: Run tests**

```bash
npx jest utils/__tests__/filters.test.ts --no-coverage
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add utils/filters.ts utils/__tests__/filters.test.ts
git commit -m "feat: add meal/restaurant filter logic with tests"
```

---

### Task 8: Create useSettings Hook

**Files:**
- Create: `hooks/useSettings.ts`

- [ ] **Step 1: Create the settings hook**

```typescript
// hooks/useSettings.ts
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, UserSettings, WeightEntry } from '../api/types';

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
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useSettings.ts
git commit -m "feat: add useSettings hook with AsyncStorage persistence"
```

---

### Task 9: Create useNearbyChains Hook

**Files:**
- Create: `hooks/useNearbyChains.ts`

- [ ] **Step 1: Create the location + data fetching hook**

```typescript
// hooks/useNearbyChains.ts
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { NearbyMatch } from '../api/types';
import { getNearbyRestaurants } from '../api/client';

type LocationStatus = 'loading' | 'granted' | 'denied' | 'undetermined';

export function useNearbyChains(radiusMiles: number) {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [restaurants, setRestaurants] = useState<NearbyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status: permStatus } = await Location.getForegroundPermissionsAsync();

      if (permStatus === 'undetermined') {
        setStatus('undetermined');
        setIsLoading(false);
        return;
      }

      if (permStatus !== 'granted') {
        setStatus('denied');
        setIsLoading(false);
        return;
      }

      setStatus('granted');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const data = await getNearbyRestaurants(
        location.coords.latitude,
        location.coords.longitude,
        radiusMiles
      );

      setRestaurants(data);
    } catch (e) {
      setError('Could not load restaurants. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [radiusMiles]);

  const requestPermission = useCallback(async () => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    if (permStatus === 'granted') {
      setStatus('granted');
      fetchRestaurants();
    } else {
      setStatus('denied');
    }
  }, [fetchRestaurants]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    status,
    restaurants,
    isLoading,
    error,
    retry: fetchRestaurants,
    requestPermission,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/useNearbyChains.ts
git commit -m "feat: add useNearbyChains hook with location permissions"
```

---

## Chunk 3: Navigation & Core Components

### Task 10: Set Up Root Layout with Providers

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Replace the default root layout with providers**

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: set up root layout with gesture handler and bottom sheet providers"
```

---

### Task 11: Set Up Tab Layout with Native Tabs

**Files:**
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create the tab layout**

```tsx
// app/(tabs)/_layout.tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useThemeColors } from '../../constants/theme';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <NativeTabs
      iconColor={{ default: colors.textTertiary, selected: colors.brandGreen }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="fork.knife" md="restaurant" />
        <NativeTabs.Trigger.Label>Restaurants</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf="gear" md="settings" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

- [ ] **Step 2: Create placeholder screen files**

```tsx
// app/(tabs)/index.tsx
import { View, Text } from 'react-native';

export default function RestaurantsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Restaurants</Text>
    </View>
  );
}
```

```tsx
// app/(tabs)/settings.tsx
import { View, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Settings</Text>
    </View>
  );
}
```

- [ ] **Step 3: Verify app runs with two tabs**

```bash
npx expo start
```

Expected: App shows two tabs (Restaurants, Settings) with native tab bar. On iOS 26 simulator, tab bar should have Liquid Glass effect automatically.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/
git commit -m "feat: add native tab navigation with Restaurants and Settings tabs"
```

---

### Task 12: Create MacroDisplay Component

**Files:**
- Create: `components/MacroDisplay.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/MacroDisplay.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, Typography } from '../constants/theme';

interface MacroDisplayProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: 'small' | 'large';
}

export function MacroDisplay({ protein, carbs, fat, size = 'small' }: MacroDisplayProps) {
  const colors = useThemeColors();

  if (size === 'large') {
    return (
      <View style={styles.largeContainer}>
        <View style={[styles.largeCard, { backgroundColor: colors.proteinBg }]}>
          <Text style={[styles.largeLabel, { color: colors.textSecondary }]}>PROTEIN</Text>
          <Text style={[styles.largeValue, { color: colors.protein }]}>{protein}g</Text>
        </View>
        <View style={[styles.largeCard, { backgroundColor: colors.carbsBg }]}>
          <Text style={[styles.largeLabel, { color: colors.textSecondary }]}>CARBS</Text>
          <Text style={[styles.largeValue, { color: colors.carbs }]}>{carbs}g</Text>
        </View>
        <View style={[styles.largeCard, { backgroundColor: colors.fatBg }]}>
          <Text style={[styles.largeLabel, { color: colors.textSecondary }]}>FAT</Text>
          <Text style={[styles.largeValue, { color: colors.fat }]}>{fat}g</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.smallContainer}>
      <Text style={[styles.smallText, { color: colors.protein }]}>P {protein}g</Text>
      <Text style={[styles.smallText, { color: colors.carbs }]}>C {carbs}g</Text>
      <Text style={[styles.smallText, { color: colors.fat }]}>F {fat}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  smallText: {
    fontSize: 8,
    fontWeight: '700',
  },
  largeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  largeCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  largeLabel: {
    ...Typography.macroLabel,
  },
  largeValue: {
    ...Typography.macro,
    marginTop: 2,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/MacroDisplay.tsx
git commit -m "feat: add MacroDisplay component (small + large variants)"
```

---

### Task 13: Create MealCard Component

**Files:**
- Create: `components/MealCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/MealCard.tsx
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useThemeColors } from '../constants/theme';
import { MacroDisplay } from './MacroDisplay';
import { Meal } from '../api/types';

interface MealCardProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}

export function MealCard({ meal, onPress }: MealCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => onPress(meal)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.photo }} style={styles.image} />
        <View style={styles.calorieBadge}>
          <Text style={styles.calorieText}>{meal.calories} cal</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {meal.name}
        </Text>
        <MacroDisplay protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 80,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  calorieBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  calorieText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    padding: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/MealCard.tsx
git commit -m "feat: add MealCard component with photo, calories, and macros"
```

---

### Task 14: Create FilterChips Component

**Files:**
- Create: `components/FilterChips.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/FilterChips.tsx
import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '../constants/theme';
import { Filters } from '../api/types';

interface FilterChipsProps {
  filters: Filters;
  cuisines: string[];
  onToggleCalories: (max: number | null) => void;
  onToggleProtein: () => void;
  onToggleCuisine: (cuisine: string | null) => void;
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.chipActive : colors.chipInactive,
          borderColor: active ? colors.chipActiveBorder : colors.chipInactiveBorder,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.brandGreen : colors.chipInactiveText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const CALORIE_OPTIONS = [400, 500, 600];

export function FilterChips({
  filters,
  cuisines,
  onToggleCalories,
  onToggleProtein,
  onToggleCuisine,
}: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CALORIE_OPTIONS.map((cal) => (
        <Chip
          key={`cal-${cal}`}
          label={`Under ${cal} cal`}
          active={filters.maxCalories === cal}
          onPress={() =>
            onToggleCalories(filters.maxCalories === cal ? null : cal)
          }
        />
      ))}
      <Chip
        label="High Protein"
        active={filters.highProtein}
        onPress={onToggleProtein}
      />
      {cuisines.map((cuisine) => (
        <Chip
          key={cuisine}
          label={cuisine}
          active={filters.cuisine === cuisine}
          onPress={() =>
            onToggleCuisine(filters.cuisine === cuisine ? null : cuisine)
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/FilterChips.tsx
git commit -m "feat: add FilterChips component with calorie, protein, and cuisine filters"
```

---

## Chunk 4: Restaurant Screen & Detail Sheet

### Task 15: Create RestaurantCard Component

**Files:**
- Create: `components/RestaurantCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/RestaurantCard.tsx
import { View, Text, ScrollView, Image, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '../constants/theme';
import { MealCard } from './MealCard';
import { Meal, NearbyMatch, Filters } from '../api/types';
import { filterMeals } from '../utils/filters';

let GlassView: any = View;
if (Platform.OS === 'ios') {
  try {
    GlassView = require('expo-glass-effect').GlassView;
  } catch {}
}

interface RestaurantCardProps {
  match: NearbyMatch;
  filters: Filters;
  onMealPress: (meal: Meal, match: NearbyMatch) => void;
}

export function RestaurantCard({ match, filters, onMealPress }: RestaurantCardProps) {
  const colors = useThemeColors();
  const filteredMeals = filterMeals(match.chain.meals, filters);

  if (filteredMeals.length === 0) return null;

  const CardContainer = Platform.OS === 'ios' ? GlassView : View;
  const cardStyle = Platform.OS === 'ios'
    ? [styles.card, { borderRadius: 20 }]
    : [styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 }];

  return (
    <CardContainer style={cardStyle} glassEffectStyle="regular">
      <View style={styles.header}>
        <Image source={{ uri: match.chain.logo }} style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>
            {match.chain.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            {match.distance.toFixed(1)} mi · {match.chain.cuisine}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mealScroll}
      >
        {filteredMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onPress={(m) => onMealPress(m, match)}
          />
        ))}
      </ScrollView>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  mealScroll: {
    gap: 10,
    paddingBottom: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/RestaurantCard.tsx
git commit -m "feat: add RestaurantCard with glass effect and meal carousel"
```

---

### Task 16: Create MealDetailSheet Component

**Files:**
- Create: `components/MealDetailSheet.tsx`

- [ ] **Step 1: Create the bottom sheet component**

```tsx
// components/MealDetailSheet.tsx
import React, { forwardRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Linking,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import MapView, { Marker } from 'react-native-maps';
import { useThemeColors, Typography } from '../constants/theme';
import { MacroDisplay } from './MacroDisplay';
import { Meal, NearbyMatch } from '../api/types';

interface MealDetailSheetProps {
  meal: Meal | null;
  match: NearbyMatch | null;
  onClose: () => void;
}

export const MealDetailSheet = forwardRef<BottomSheet, MealDetailSheetProps>(
  ({ meal, match, onClose }, ref) => {
    const colors = useThemeColors();

    const openDirections = useCallback(() => {
      if (!match) return;
      const { latitude, longitude } = match;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Apple Maps', 'Google Maps', 'Waze'],
            cancelButtonIndex: 0,
          },
          (index) => {
            if (index === 1) {
              Linking.openURL(`maps://?daddr=${latitude},${longitude}`);
            } else if (index === 2) {
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
              );
            } else if (index === 3) {
              Linking.openURL(
                `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
              ).catch(() => {
                Linking.openURL('https://apps.apple.com/app/waze/id323229106');
              });
            }
          }
        );
      } else {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        );
      }
    }, [match]);

    const openDeliveryApp = useCallback((url: string) => {
      Linking.openURL(url).catch(() => {
        // App not installed — could redirect to app store
      });
    }, []);

    if (!meal || !match) return null;

    const deliveryLinks = Object.entries(match.chain.deliveryLinks).filter(
      ([, url]) => url
    );
    const deliveryLabels: Record<string, string> = {
      uberEats: 'Uber Eats',
      deliveroo: 'Deliveroo',
      doordash: 'DoorDash',
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['85%']}
        enableDynamicSizing={false}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          {/* Meal photo */}
          <View style={styles.photoContainer}>
            <Image source={{ uri: meal.photo }} style={styles.photo} />
            <View style={styles.calorieBadge}>
              <Text style={styles.calorieNumber}>{meal.calories}</Text>
              <Text style={styles.calorieLabel}>calories</Text>
            </View>
          </View>

          {/* Meal info */}
          <Text style={[styles.mealName, { color: colors.text }]}>
            {meal.name}
          </Text>
          <Text style={[styles.restaurantInfo, { color: colors.textSecondary }]}>
            {match.chain.name} · {match.distance.toFixed(1)} mi away
          </Text>

          {/* Macros */}
          <View style={styles.macroSection}>
            <MacroDisplay
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              size="large"
            />
          </View>

          {/* Map */}
          <Pressable onPress={openDirections} style={styles.mapContainer}>
            <MapView
              style={styles.map}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              initialRegion={{
                latitude: match.latitude,
                longitude: match.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: match.latitude,
                  longitude: match.longitude,
                }}
                title={match.chain.name}
              />
            </MapView>
            <Text style={[styles.mapHint, { color: colors.textSecondary }]}>
              Tap to open directions
            </Text>
          </Pressable>

          {/* Delivery buttons */}
          {deliveryLinks.length > 0 && (
            <View style={styles.deliveryRow}>
              {deliveryLinks.map(([key, url]) => (
                <Pressable
                  key={key}
                  onPress={() => openDeliveryApp(url!)}
                  style={({ pressed }) => [
                    styles.deliveryButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.deliveryText, { color: colors.text }]}>
                    {deliveryLabels[key] || key}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Website link */}
          {match.chain.websiteUrl && (
            <Pressable
              onPress={() => Linking.openURL(match.chain.websiteUrl)}
              style={({ pressed }) => [
                styles.websiteButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.websiteText, { color: colors.textSecondary }]}>
                Visit Restaurant Website
              </Text>
            </Pressable>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  photoContainer: {
    height: 120,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  calorieBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  calorieNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  calorieLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
  },
  mealName: {
    ...Typography.heading,
    paddingHorizontal: 20,
    paddingTop: 14,
    lineHeight: 26,
  },
  restaurantInfo: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 20,
    marginTop: 3,
  },
  macroSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  map: {
    height: 120,
  },
  mapHint: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    paddingVertical: 6,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  deliveryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  websiteButton: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  websiteText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/MealDetailSheet.tsx
git commit -m "feat: add MealDetailSheet with macros, map, delivery links"
```

---

### Task 17: Build Restaurants Screen

**Files:**
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Implement the full Restaurants screen**

```tsx
// app/(tabs)/index.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { useThemeColors, Typography, Spacing } from '../../constants/theme';
import { useNearbyChains } from '../../hooks/useNearbyChains';
import { useSettings } from '../../hooks/useSettings';
import { RestaurantCard } from '../../components/RestaurantCard';
import { FilterChips } from '../../components/FilterChips';
import { MealDetailSheet } from '../../components/MealDetailSheet';
import { Filters, Meal, NearbyMatch } from '../../api/types';
import { filterRestaurants, getUniqueCuisines } from '../../utils/filters';

export default function RestaurantsScreen() {
  const colors = useThemeColors();
  const { settings } = useSettings();
  const { status, restaurants, isLoading, error, retry, requestPermission } =
    useNearbyChains(settings.distanceRadius);

  const [filters, setFilters] = useState<Filters>({
    maxCalories: null,
    highProtein: false,
    cuisine: null,
  });

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<NearbyMatch | null>(null);
  const sheetRef = useRef<BottomSheet>(null);

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurants, filters),
    [restaurants, filters]
  );

  const cuisines = useMemo(() => getUniqueCuisines(restaurants), [restaurants]);

  const handleMealPress = useCallback((meal: Meal, match: NearbyMatch) => {
    setSelectedMeal(meal);
    setSelectedMatch(match);
    sheetRef.current?.snapToIndex(0);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSelectedMeal(null);
    setSelectedMatch(null);
  }, []);

  // --- State screens ---

  if (status === 'undetermined') {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>
          Find Healthy Meals Near You
        </Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
          HealMeal needs your location to find restaurants near you.
        </Text>
        <Pressable
          onPress={requestPermission}
          style={[styles.stateButton, { backgroundColor: colors.brandGreen }]}
        >
          <Text style={styles.stateButtonText}>Enable Location</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (status === 'denied') {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>
          Location Access Denied
        </Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
          Please enable location access in your device settings to use HealMeal.
        </Text>
        <Pressable
          onPress={() => Linking.openSettings()}
          style={[styles.stateButton, { backgroundColor: colors.brandGreen }]}
        >
          <Text style={styles.stateButtonText}>Open Settings</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Oops</Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
          {error}
        </Text>
        <Pressable
          onPress={retry}
          style={[styles.stateButton, { backgroundColor: colors.brandGreen }]}
        >
          <Text style={styles.stateButtonText}>Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[Typography.title, { lineHeight: 38 }]}>
          <Text style={{ color: colors.text }}>Heal</Text>
          <Text style={{ color: colors.brandGreen }}>Meal</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Within {settings.distanceRadius} miles of you
        </Text>
      </View>

      {/* Filters */}
      <FilterChips
        filters={filters}
        cuisines={cuisines}
        onToggleCalories={(max) => setFilters((f) => ({ ...f, maxCalories: max }))}
        onToggleProtein={() => setFilters((f) => ({ ...f, highProtein: !f.highProtein }))}
        onToggleCuisine={(cuisine) => setFilters((f) => ({ ...f, cuisine }))}
      />

      {/* Restaurant list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandGreen} />
        </View>
      ) : filteredRestaurants.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
            No healthy restaurants nearby — try increasing your radius in Settings.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filteredRestaurants.map((match) => (
            <RestaurantCard
              key={match.chain.id}
              match={match}
              filters={filters}
              onMealPress={handleMealPress}
            />
          ))}
        </ScrollView>
      )}

      {/* Meal detail sheet */}
      <MealDetailSheet
        ref={sheetRef}
        meal={selectedMeal}
        match={selectedMatch}
        onClose={handleSheetClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: 14,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  list: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  stateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
```

- [ ] **Step 2: Verify the Restaurants screen renders with mock data**

```bash
npx expo start
```

Expected: App shows "HealMeal" title, filter chips, restaurant cards with meal carousels. Tapping a meal opens the bottom sheet with macros, map, and delivery buttons.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "feat: build Restaurants screen with filters, cards, and meal detail sheet"
```

---

## Chunk 5: Settings Screen

### Task 18: Create WeightHistory Component

**Files:**
- Create: `components/WeightHistory.tsx`

- [ ] **Step 1: Create the weight history sub-view**

```tsx
// components/WeightHistory.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from 'victory-native';
import { useThemeColors, Spacing } from '../constants/theme';
import { WeightEntry } from '../api/types';

interface WeightHistoryProps {
  history: WeightEntry[];
  onAdd: (entry: WeightEntry) => void;
  onRemove: (date: string) => void;
  onClose: () => void;
}

export function WeightHistory({ history, onAdd, onRemove, onClose }: WeightHistoryProps) {
  const colors = useThemeColors();
  const [weight, setWeight] = useState('');

  const handleAdd = () => {
    const num = parseFloat(weight);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid weight', 'Please enter a valid number.');
      return;
    }
    onAdd({ date: new Date().toISOString().split('T')[0], weight: num });
    setWeight('');
  };

  const handleRemove = (date: string) => {
    Alert.alert('Remove entry?', `Delete weight for ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onRemove(date) },
    ]);
  };

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sortedHistory.map((e) => ({
    x: new Date(e.date),
    y: e.weight,
  }));

  const screenWidth = Dimensions.get('window').width;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weight History</Text>
        <Pressable onPress={onClose}>
          <Text style={[styles.closeButton, { color: colors.brandGreen }]}>Done</Text>
        </Pressable>
      </View>

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <View style={styles.chartContainer}>
          <VictoryChart
            width={screenWidth - 40}
            height={180}
            theme={VictoryTheme.clean}
            padding={{ top: 10, bottom: 30, left: 45, right: 20 }}
          >
            <VictoryAxis
              tickFormat={(t: Date) =>
                `${t.getDate()}/${t.getMonth() + 1}`
              }
              style={{
                tickLabels: { fontSize: 10, fill: colors.textTertiary },
                axis: { stroke: colors.surfaceBorder },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(t: number) => `${t}kg`}
              style={{
                tickLabels: { fontSize: 10, fill: colors.textTertiary },
                axis: { stroke: colors.surfaceBorder },
              }}
            />
            <VictoryLine
              data={chartData}
              style={{
                data: { stroke: colors.brandGreen, strokeWidth: 2 },
              }}
            />
          </VictoryChart>
        </View>
      )}

      {/* Add entry */}
      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
          ]}
          placeholder="Weight (kg)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <Pressable
          onPress={handleAdd}
          style={[styles.addButton, { backgroundColor: colors.brandGreen }]}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {/* History list (newest first for display) */}
      <FlatList
        data={[...sortedHistory].reverse()}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleRemove(item.date)}
            style={[styles.entry, { borderBottomColor: colors.surfaceBorder }]}
          >
            <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
              {item.date}
            </Text>
            <Text style={[styles.entryWeight, { color: colors.text }]}>
              {item.weight} kg
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            No entries yet. Add your first weight above.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  addButton: {
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryDate: {
    fontSize: 14,
  },
  entryWeight: {
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/WeightHistory.tsx
git commit -m "feat: add WeightHistory component with add/remove entries"
```

---

### Task 19: Build Settings Screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Implement the full Settings screen**

```tsx
// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { useSettings } from '../../hooks/useSettings';
import { WeightHistory } from '../../components/WeightHistory';

const ALL_CUISINES = ['Chicken', 'Italian', 'Japanese', 'Mediterranean', 'Mexican'];

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { settings, isLoaded, updateSettings, addWeightEntry, removeWeightEntry } =
    useSettings();
  const [showWeightHistory, setShowWeightHistory] = useState(false);

  if (!isLoaded) return null;

  const toggleCuisine = (cuisine: string) => {
    const current = settings.cuisinePreferences;
    const next = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine];
    updateSettings({ cuisinePreferences: next });
  };

  const editGoalWeight = () => {
    Alert.prompt(
      'Goal Weight',
      'Enter your goal weight in kg',
      (text) => {
        const num = parseFloat(text);
        if (!isNaN(num) && num > 0) {
          updateSettings({ goalWeight: num });
        }
      },
      'plain-text',
      settings.goalWeight > 0 ? String(settings.goalWeight) : '',
      'decimal-pad'
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.title, styles.title]}>
          <Text style={{ color: colors.text }}>Settings</Text>
        </Text>

        {/* Dietary Preferences */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          DIETARY PREFERENCES
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Calorie Target</Text>
            <Text style={[styles.value, { color: colors.brandGreen }]}>
              {settings.calorieTarget} cal
            </Text>
          </View>
          <Slider
            minimumValue={200}
            maximumValue={1000}
            step={50}
            value={settings.calorieTarget}
            onSlidingComplete={(val) => updateSettings({ calorieTarget: val })}
            minimumTrackTintColor={colors.brandGreen}
            style={styles.slider}
          />

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>High Protein Only</Text>
            <Switch
              value={settings.highProtein}
              onValueChange={(val) => updateSettings({ highProtein: val })}
              trackColor={{ true: colors.brandGreen }}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>
            Cuisine Preferences
          </Text>
          <View style={styles.cuisineGrid}>
            {ALL_CUISINES.map((cuisine) => {
              const selected = settings.cuisinePreferences.includes(cuisine);
              return (
                <Pressable
                  key={cuisine}
                  onPress={() => toggleCuisine(cuisine)}
                  style={[
                    styles.cuisineChip,
                    {
                      backgroundColor: selected ? colors.chipActive : colors.chipInactive,
                      borderColor: selected ? colors.chipActiveBorder : colors.chipInactiveBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cuisineChipText,
                      { color: selected ? colors.brandGreen : colors.chipInactiveText },
                    ]}
                  >
                    {cuisine}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {settings.cuisinePreferences.length === 0
              ? 'No preference — showing all cuisines'
              : `Showing ${settings.cuisinePreferences.length} selected`}
          </Text>
        </View>

        {/* Weight Management */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          WEIGHT MANAGEMENT
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Pressable style={styles.row} onPress={() => setShowWeightHistory(true)}>
            <Text style={[styles.label, { color: colors.text }]}>Current Weight</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {settings.currentWeight > 0 ? `${settings.currentWeight} kg` : 'Not set'} ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={editGoalWeight}>
            <Text style={[styles.label, { color: colors.text }]}>Goal Weight</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {settings.goalWeight > 0 ? `${settings.goalWeight} kg` : 'Tap to set'} ›
            </Text>
          </Pressable>
        </View>

        {/* Location */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          LOCATION
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Distance Radius</Text>
            <Text style={[styles.value, { color: colors.brandGreen }]}>
              {settings.distanceRadius} mi
            </Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={0.5}
            value={settings.distanceRadius}
            onSlidingComplete={(val) => updateSettings({ distanceRadius: val })}
            minimumTrackTintColor={colors.brandGreen}
            style={styles.slider}
          />
        </View>
      </ScrollView>

      {/* Weight History Modal */}
      <Modal visible={showWeightHistory} animationType="slide">
        <WeightHistory
          history={settings.weightHistory}
          onAdd={addWeightEntry}
          onRemove={removeWeightEntry}
          onClose={() => setShowWeightHistory(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  slider: {
    marginTop: 8,
    marginBottom: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  cuisineChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
  },
});
```

- [ ] **Step 2: Verify Settings screen**

```bash
npx expo start
```

Expected: Settings tab shows Dietary Preferences (calorie slider, high protein toggle), Weight Management (current weight tap opens history modal), and Location (distance slider).

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/settings.tsx
git commit -m "feat: build Settings screen with dietary prefs, weight management, location"
```

---

### Task 20: Final Verification & Cleanup

- [ ] **Step 1: Remove any template boilerplate files that aren't needed**

Check for and remove default template files that were replaced (e.g., `app/(tabs)/explore.tsx`, `app/(tabs)/two.tsx`, `components/ExternalLink.tsx`, etc.).

- [ ] **Step 2: Run the app on iOS simulator**

```bash
npx expo run:ios
```

Verify:
- Two tabs work (Restaurants, Settings)
- Filter chips toggle correctly
- Restaurant cards display with meal carousels
- Tapping a meal opens the bottom sheet with macros, map, delivery buttons
- Settings sliders and toggles persist values
- Weight history modal opens and allows add/remove
- Light/dark mode switches correctly with system theme
- On iOS 26 simulator: Liquid Glass tab bar and glass effects render

- [ ] **Step 3: Run the app on Android emulator**

```bash
npx expo run:android
```

Verify:
- Same functionality works (without Liquid Glass — regular styled views)
- Material Design 3 tab bar renders

- [ ] **Step 4: Run tests**

```bash
npx jest --no-coverage
```

Expected: All filter tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: cleanup template boilerplate, finalize MVP"
```
