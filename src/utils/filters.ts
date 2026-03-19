import { Filters, Meal, NearbyMatch } from '@/api/types';

export function filterMeals(meals: Meal[], filters: Filters): Meal[] {
  return meals.filter((meal) => {
    if (filters.maxCalories !== null && meal.calories > filters.maxCalories) return false;
    if (filters.minProtein !== null && meal.protein < filters.minProtein) return false;
    if (filters.maxCarbs !== null && meal.carbs > filters.maxCarbs) return false;
    if (filters.maxFat !== null && meal.fat > filters.maxFat) return false;
    return true;
  });
}

export function filterRestaurants(
  matches: NearbyMatch[],
  filters: Filters
): NearbyMatch[] {
  return matches.filter((match) => {
    if (filters.cuisine && match.chain.cuisine !== filters.cuisine) return false;
    return true;
  });
}

export function getUniqueCuisines(matches: NearbyMatch[]): string[] {
  const cuisines = new Set(matches.map((m) => m.chain.cuisine));
  return Array.from(cuisines).sort();
}
