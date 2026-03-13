# HealMeal — Design Spec

## Overview

**HealMeal** helps health-conscious users find healthy meals at restaurants near them. Users open the app, see nearby chain restaurants that exist in the HealMeal database, and browse their healthiest meal options with full macro breakdowns. They can filter by calorie budget, high protein, cuisine type, and order directly through delivery apps.

### Problem

You're hungry, want to eat out or order in, but you're trying to eat healthier, lose weight, or hit your macros. Right now you either guess, google "healthiest thing at Nando's", or give up and order whatever. HealMeal tells you exactly what to order.

### MVP Scope

Two tabs only: **Restaurants** and **Settings**. No auth, no onboarding (built later).

Future additions (out of scope for MVP): Meals tab (search meals directly), Me page (calorie breakdown, weight management, meal scanner, manual meal logging).

---

## Tech Stack

| Component | Choice |
|---|---|
| Framework | Expo SDK 55 (React Native 0.83, React 19.2) |
| Navigation | Expo Router v55 with native bottom tabs |
| Liquid Glass | `expo-glass-effect` (official) for custom glass views; native tabs/toolbars get Liquid Glass automatically on iOS 26 |
| Maps | `react-native-maps` for restaurant pin in meal detail sheet |
| Storage | AsyncStorage for local settings and weight history |
| Engine | Hermes v1 |
| Architecture | New Architecture (mandatory in SDK 55) |
| Template | `npx create-expo-app@latest --template default@sdk-55` |

### Platform Behavior

- **iOS 26+**: Full Apple Liquid Glass — tab bar, nav bar, toolbars, custom glass views via `expo-glass-effect`
- **iOS < 26**: Standard iOS styling, glass falls back to regular views
- **Android**: Material Design 3 dynamic colors on tabs, glass falls back to regular views

---

## Design Language

### Anti-Slop Rules

These rules prevent the generic AI-generated look:

- **No Inter font** — SF Pro (system) for body, distinctive display font for headings
- **No purple/indigo** — green is the brand color, used with conviction
- **No symmetrical card grids** — horizontal meal carousels break predictable patterns
- **Dramatic type hierarchy** — big bold headlines (weight 900, tight letter-spacing), not incremental size steps
- **Texture and depth** — real Liquid Glass refraction, not flat cards
- **One strong brand color** (green) with sharp accents (blue for carbs, amber for fat)

### Typography

- **App title "HealMeal"**: Weight 900, letter-spacing -1.5px, gradient fill. "Heal" in primary text color, "Meal" in brand green
- **Headings**: Weight 800, tight tracking, system display font
- **Body**: SF Pro (system), weight 500-600
- **Macro numbers**: Weight 800, large size, color-coded

### Color System

| Token | Light | Dark |
|---|---|---|
| Brand green | `#16a34a` | `#4ade80` |
| Protein | `#16a34a` / `#4ade80` | Green tint |
| Carbs | `#3b82f6` / `#60a5fa` | Blue tint |
| Fat | `#f59e0b` / `#fbbf24` | Amber tint |
| Background | `#f2f5f0` | `#0a0a0a` |
| Card glass (light) | `rgba(255,255,255,0.65)` with blur | — |
| Card glass (dark) | — | `rgba(255,255,255,0.06)` with blur |
| Active chip | Green tint bg + green border | Same, brighter green |
| Inactive chip | White glass | Dark glass |

### Theme

System-driven light/dark mode. Same layout and structure, colors adapt. Glass material darkens in dark mode with lighter borders. Accent colors brighten slightly in dark mode for contrast.

---

## Screen: Restaurants

The main discovery screen. Vertically scrolling list of restaurant cards.

### Layout (top to bottom)

1. **Header**: "HealMeal" title (bold gradient) + subtitle "Within X miles of you"
2. **Filter chips**: Horizontal scrollable row
3. **Restaurant cards**: Vertically scrolling list

### Filter Chips

Horizontal scrollable chips at the top of the screen:
- Calorie filters: "Under 400 cal", "Under 500 cal", "Under 600 cal"
- Macro filters: "High Protein"
- Cuisine filters: "Italian", "Japanese", "Mexican", "Indian", etc.

Active chip: green-tinted background with green border. Inactive: glass-styled chip. Multiple filters can be active simultaneously. Filters reduce the visible meals within each restaurant card. Restaurants with no matching meals are hidden.

### Restaurant Card

Each card is a frosted glass container (`expo-glass-effect` on iOS 26, regular styled view elsewhere):

- **Header row**: Restaurant logo (40px, rounded square) + restaurant name (weight 750) + distance + cuisine tag
- **Meal carousel**: Horizontal `ScrollView` of meal cards within the restaurant

### Meal Card (inside carousel)

- **Width**: ~130px fixed
- **Top half**: Meal photo (80px height) with calorie badge overlaid bottom-right (blurred dark background, white text)
- **Bottom half**: Meal name (weight 700, 11px) + macro row: `P 42g` `C 12g` `F 14g` color-coded

---

## Screen: Meal Detail (Bottom Sheet)

Triggered by tapping a meal card. Slides up as a bottom sheet modal.

### Layout (top to bottom)

1. **Drag handle**: Standard iOS pull-down indicator
2. **Meal photo**: Large banner (120px), rounded corners, calorie count badge top-right
3. **Meal info**: Large bold name (22px, weight 800) + restaurant name + distance
4. **Macro breakdown**: Three equal cards side by side — Protein (green), Carbs (blue), Fat (amber). Large numbers (24px, weight 800), uppercase labels
5. **Map**: Shows restaurant location with pin. Tap triggers system action sheet to choose navigation app (Apple Maps / Google Maps / Waze)
6. **Order buttons**: Side by side — region-aware delivery apps. UK: Uber Eats + Deliveroo. US: Uber Eats + DoorDash. Deep link to restaurant in each app, falls back to App Store if not installed
7. **Website link**: "Visit Restaurant Website" — opens in-app browser or Safari

### Behavior

- Swipe down to dismiss
- Sheet gets Liquid Glass treatment on iOS 26
- Map uses `react-native-maps` `MapView` with a single `Marker`
- Directions: `Linking.openURL` with platform-appropriate maps URL, or use `ActionSheetIOS` to let user pick

---

## Screen: Settings

Grouped list layout (iOS grouped table style).

### Sections

**Dietary Preferences**
- Calorie target: Slider or number input (e.g., 400-800 cal)
- High protein: Toggle switch
- Cuisine preferences: Multi-select list

**Weight Management**
- Current weight: Displays current value. Tap opens a sub-view with:
  - Historical weight entries (date + weight) as a list
  - Add/edit/remove entries
  - Simple line chart showing weight trend over time
- Goal weight: Number input

**Location**
- Distance radius: Slider (1mi — 10mi)

**Notifications**
- Push notification toggle

**Account**
- Name, email (local-only, no auth)

### Storage

All settings persisted locally via AsyncStorage. No backend calls for settings in MVP.

---

## Data Architecture

### Data Flow

1. App gets user's GPS location
2. App queries a places API (Google Places or Apple MapKit) for nearby restaurants
3. App fetches chain database from the HealMeal backend (list of known chains with meals/macros)
4. App matches nearby restaurant results against the chain database by name
5. Matches are displayed as restaurant cards with their meal data
6. Restaurants not in the HealMeal DB are excluded. Chains in the DB but not nearby are excluded.

### Types

```typescript
// From HealMeal backend
interface Chain {
  id: string;
  name: string;
  logo: string;          // URL
  cuisine: string;
  websiteUrl: string;
  deliveryLinks: {
    uberEats?: string;
    deliveroo?: string;
    doordash?: string;
  };
  meals: Meal[];
}

interface Meal {
  id: string;
  chainId: string;
  name: string;
  photo: string;         // URL
  calories: number;
  protein: number;       // grams
  carbs: number;         // grams
  fat: number;           // grams
}

// From places API match
interface NearbyMatch {
  chain: Chain;
  distance: number;      // miles
  latitude: number;
  longitude: number;
  address: string;
}

// Local storage
interface UserSettings {
  calorieTarget: number;
  highProtein: boolean;
  cuisinePreferences: string[];
  currentWeight: number;
  goalWeight: number;
  weightHistory: { date: string; weight: number }[];
  distanceRadius: number;  // miles
  notificationsEnabled: boolean;
}
```

### API Layer

```typescript
// api/client.ts — swap mock for real when backend is ready
getChains(): Promise<Chain[]>
getNearbyRestaurants(lat: number, lng: number, radiusMiles: number): Promise<NearbyMatch[]>
```

Mock data lives in `api/mock-data.ts` with realistic chain/meal data for development.

---

## Project Structure

```
healmeal/
├── app/                      # Expo Router file-based routing
│   ├── _layout.tsx           # Root layout
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab bar config (native tabs)
│   │   ├── index.tsx         # Restaurants screen
│   │   └── settings.tsx      # Settings screen
├── components/
│   ├── RestaurantCard.tsx    # Glass card with meal carousel
│   ├── MealCard.tsx          # Photo + name + macros
│   ├── MealDetailSheet.tsx   # Bottom sheet modal
│   ├── FilterChips.tsx       # Horizontal scrollable filters
│   ├── MacroDisplay.tsx      # Color-coded P/C/F display
│   └── WeightHistory.tsx     # Weight tracking with chart
├── api/
│   ├── types.ts              # Chain, Meal, UserSettings types
│   ├── client.ts             # API client (mock initially)
│   └── mock-data.ts          # Fake chains/meals for development
├── hooks/
│   ├── useNearbyChains.ts    # Location + places matching logic
│   └── useSettings.ts        # AsyncStorage read/write
├── constants/
│   └── theme.ts              # Colors, spacing, typography tokens
└── assets/                   # Fonts, images
```

---

## Out of Scope (Future)

- User authentication / accounts
- Onboarding flow (deep, value-driven — built last)
- Meals tab (search meals directly across all chains)
- Me page (calorie breakdown, weight management dashboard, meal scanner, manual meal logging)
- Backend integration (mock API for now)
