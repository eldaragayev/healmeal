# healmeal — App Specification

## What it is

healmeal helps you find healthy meals at chain restaurants near you. You're hungry, you want to eat out or order in, but you're trying to eat healthier. healmeal shows you exactly what to order, with full nutrition breakdowns.

## Screens

### Restaurants (main tab)

The primary screen. Shows nearby chain restaurants with their healthiest meal options.

**Header area:** Two buttons in the top-right corner — search and filter. Each is a separate circular button with its own background.

**Search:** Tapping the search button reveals a native search bar. Type to filter restaurants by name, cuisine, or meal name in real-time. Cancel dismisses the search bar completely.

**Filter:** Tapping the filter button opens a full filter sheet with:
- **Calories** — preset options: Any, 300, 400, 500, 600, 800 max per meal
- **Macros** — toggles for High Protein (30g+), Low Carb (under 30g), Low Fat (under 15g)
- **Cuisine** — filter by restaurant type (Chicken, Italian, Japanese, Mediterranean, Mexican, etc.)
- **Distance** — slider from 1 to 10 miles

Active filter count shows as a badge on the filter button.

**Restaurant list:** Scrollable list of restaurants sorted by distance. Each restaurant shows:
- Logo (with letter fallback if image fails), name, distance, cuisine type
- Tapping the restaurant header opens a full restaurant detail view
- Horizontal carousel of meal cards below the header

**Meal cards:** Each card shows a meal photo (large, the hero), meal name, and a compact nutrition line: `380 cal · 42p · 12c · 14f`

**Tapping a meal card** opens the meal detail sheet.

**States:** Location permission request, location denied (with settings redirect), loading, error with retry, empty results with clear filters.

---

### Meal Detail (sheet over restaurants)

Slides up as a page sheet when tapping a meal card.

- Full-width meal photo at the top (no overlays)
- Meal name, restaurant name, distance
- Nutrition row: four columns — Calories, Protein, Carbs, Fat — with values and labels, separated by hairline dividers
- **Get Directions** button — on iOS opens an action sheet to choose Apple Maps, Google Maps, or Waze
- **Delivery buttons** — shows available delivery apps (Uber Eats, Deliveroo, DoorDash) based on what the restaurant supports. These are chain-level links.
- **Restaurant Website** link

---

### Restaurant Detail (sheet over restaurants)

Opens when tapping a restaurant header in the list.

- Restaurant name, distance, cuisine, address
- Get Directions button
- Delivery app buttons
- Full menu list — all meals shown as rows with photo thumbnail, name, calories, and macros. Tapping a meal opens the meal detail sheet.
- Restaurant website link

---

### Settings (second tab)

- **Weight section:**
  - Current Weight — tap opens a weight history view with a trend chart (bar visualization), add/remove entries, sorted by date
  - Goal Weight — tap to enter via prompt
- **About section:** App version

---

## Data

### Restaurant data
The app has its own backend with chain restaurant data (name, logo, cuisine, website, delivery links, and meals with nutrition info). For now, mock data with 5 chains: Nando's, Pizza Express, Wagamama, LEON, Chipotle. Each has 3-4 meals with realistic macros.

### How matching works
1. App gets user's GPS location
2. Calls backend with coordinates and radius
3. Backend matches nearby places against its chain database
4. Returns matched restaurants with their meals and location data
5. Restaurants not in the database don't appear

### Local storage
User settings (weight history, goal weight, distance radius) stored locally on device. No auth, no accounts.

---

## Design

- **Two tabs:** Restaurants, Settings
- **Light and dark mode** — follows system preference
- **iOS:** Uses Liquid Glass throughout — tab bar, header buttons, action buttons, filter chips all use the native glass effect. Each button gets its own individual glass background.
- **Android:** Falls back to standard Material Design 3 styling
- **Typography:** Rounded system font on iOS for warmth. Bold weights for headings, clean weights for body.
- **Colors:** Brand green as the primary accent. Muted earthy palette — protein is green, carbs blue, fat amber. Not saturated/rainbow — subtle and cohesive.
- **Layout:** Clean, spacious. Photos are the hero on meal cards. No boxy bordered cards — inline layout with breathing room between restaurants.
- **Buttons:** All interactive buttons use Liquid Glass with the `isInteractive` property for native press bounce and shimmer animations.

---

## Future (not built yet)

- Onboarding flow (deep, value-driven)
- Meals tab (search across all meals directly)
- Me page (daily calorie breakdown, meal scanner, manual meal logging)
- Push notifications
- User authentication / accounts
- Real backend integration
