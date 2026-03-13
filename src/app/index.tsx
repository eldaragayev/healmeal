import React, { useCallback, useMemo, useState } from 'react';
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
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { useNearbyChains } from '@/hooks/useNearbyChains';
import { useSettings } from '@/hooks/useSettings';
import { RestaurantCard } from '@/components/RestaurantCard';
import { FilterSheet } from '@/components/FilterSheet';
import { MealDetailSheet } from '@/components/MealDetailSheet';
import { RestaurantDetail } from '@/components/RestaurantDetail';
import { GlassButton } from '@/components/GlassButton';
import { Filters, Meal, NearbyMatch } from '@/api/types';
import { filterRestaurants, getUniqueCuisines } from '@/utils/filters';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

export default function RestaurantsScreen() {
  const colors = useThemeColors();
  const { settings } = useSettings();
  const { status, restaurants, isLoading, error, retry, requestPermission } =
    useNearbyChains(settings.distanceRadius);

  const [filters, setFilters] = useState<Filters>({
    maxCalories: null,
    highProtein: false,
    lowCarb: false,
    lowFat: false,
    cuisine: null,
  });
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<NearbyMatch | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [restaurantDetailMatch, setRestaurantDetailMatch] = useState<NearbyMatch | null>(null);
  const [restaurantDetailVisible, setRestaurantDetailVisible] = useState(false);

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurants, filters),
    [restaurants, filters]
  );

  const cuisines = useMemo(() => getUniqueCuisines(restaurants), [restaurants]);

  const activeFilterCount =
    (filters.maxCalories !== null ? 1 : 0) +
    (filters.highProtein ? 1 : 0) +
    (filters.lowCarb ? 1 : 0) +
    (filters.lowFat ? 1 : 0) +
    (filters.cuisine !== null ? 1 : 0);

  const handleMealPress = useCallback((meal: Meal, match: NearbyMatch) => {
    setSelectedMeal(meal);
    setSelectedMatch(match);
    setSheetVisible(true);
  }, []);

  const handleRestaurantPress = useCallback((match: NearbyMatch) => {
    setRestaurantDetailMatch(match);
    setRestaurantDetailVisible(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
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
          healmeal needs your location to find restaurants near you.
        </Text>
        <GlassButton label="Enable Location" onPress={requestPermission} variant="primary" />
      </SafeAreaView>
    );
  }

  if (status === 'denied') {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Location Access Denied</Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
          Please enable location in your device settings.
        </Text>
        <GlassButton label="Open Settings" onPress={() => Linking.openSettings()} variant="primary" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Oops</Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>{error}</Text>
        <GlassButton label="Try Again" onPress={retry} variant="primary" />
      </SafeAreaView>
    );
  }

  // --- Filter button ---
  const FilterButton = () => {
    const inner = (
      <>
        <Text style={[styles.filterIcon, { color: colors.text }]}>⫶</Text>
        {activeFilterCount > 0 && (
          <View style={[styles.filterBadge, { backgroundColor: colors.brandGreen }]}>
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </>
    );

    if (hasGlass) {
      return (
        <Pressable onPress={() => setFilterSheetVisible(true)}>
          <GlassView style={styles.filterButton} glassEffectStyle="regular" isInteractive>
            {inner}
          </GlassView>
        </Pressable>
      );
    }

    return (
      <Pressable
        onPress={() => setFilterSheetVisible(true)}
        style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 }]}
      >
        {inner}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[Typography.largeTitle, { lineHeight: 42 }]}>
            <Text style={{ color: colors.text }}>heal</Text>
            <Text style={{ color: colors.brandGreen }}>meal</Text>
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
            {filteredRestaurants.length} places within {settings.distanceRadius} mi
          </Text>
        </View>
        <FilterButton />
      </View>

      {/* Restaurant list */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brandGreen} />
        </View>
      ) : filteredRestaurants.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
            No restaurants match your filters.
          </Text>
          <GlassButton label="Clear Filters" onPress={() => setFilters({ maxCalories: null, highProtein: false, lowCarb: false, lowFat: false, cuisine: null })} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredRestaurants.map((match) => (
            <RestaurantCard
              key={match.chain.id}
              match={match}
              filters={filters}
              onMealPress={handleMealPress}
              onRestaurantPress={handleRestaurantPress}
            />
          ))}
        </ScrollView>
      )}

      {/* Modals */}
      <FilterSheet
        visible={filterSheetVisible}
        filters={filters}
        cuisines={cuisines}
        onFiltersChange={setFilters}
        onClose={() => setFilterSheetVisible(false)}
      />

      <MealDetailSheet
        meal={selectedMeal}
        match={selectedMatch}
        visible={sheetVisible}
        onClose={handleSheetClose}
      />

      <RestaurantDetail
        match={restaurantDetailMatch}
        visible={restaurantDetailVisible}
        onClose={() => { setRestaurantDetailVisible(false); setRestaurantDetailMatch(null); }}
        onMealPress={(meal, match) => { setRestaurantDetailVisible(false); setRestaurantDetailMatch(null); handleMealPress(meal, match); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: { flex: 1 },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  filterIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  list: { paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
});
