import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { useNearbyChains } from '@/hooks/useNearbyChains';
import { useSettings } from '@/hooks/useSettings';
import { RestaurantCard } from '@/components/RestaurantCard';
import { FilterChips } from '@/components/FilterChips';
import { MealDetailSheet } from '@/components/MealDetailSheet';
import { RestaurantDetail } from '@/components/RestaurantDetail';
import { Filters, Meal, NearbyMatch } from '@/api/types';
import { filterRestaurants, filterMeals, getUniqueCuisines } from '@/utils/filters';

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
  const [sheetVisible, setSheetVisible] = useState(false);
  const [restaurantDetailMatch, setRestaurantDetailMatch] = useState<NearbyMatch | null>(null);
  const [restaurantDetailVisible, setRestaurantDetailVisible] = useState(false);

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurants, filters),
    [restaurants, filters]
  );

  const cuisines = useMemo(() => getUniqueCuisines(restaurants), [restaurants]);

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

  if (status === 'undetermined') {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>
          Find Healthy Meals Near You
        </Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
          healmeal needs your location to find restaurants near you.
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
          Please enable location access in your device settings to use healmeal.
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
      <View style={styles.header}>
        <Text style={[Typography.title, { lineHeight: 38 }]}>
          <Text style={{ color: colors.text }}>heal</Text>
          <Text style={{ color: colors.brandGreen }}>meal</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Within {settings.distanceRadius} miles of you
        </Text>
      </View>

      <FilterChips
        filters={filters}
        cuisines={cuisines}
        onToggleCalories={(max) => setFilters((f) => ({ ...f, maxCalories: max }))}
        onToggleProtein={() => setFilters((f) => ({ ...f, highProtein: !f.highProtein }))}
        onToggleCuisine={(cuisine) => setFilters((f) => ({ ...f, cuisine }))}
      />

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
              onRestaurantPress={handleRestaurantPress}
            />
          ))}
        </ScrollView>
      )}

      <MealDetailSheet
        meal={selectedMeal}
        match={selectedMatch}
        visible={sheetVisible}
        onClose={handleSheetClose}
      />

      <RestaurantDetail
        match={restaurantDetailMatch}
        visible={restaurantDetailVisible}
        onClose={() => {
          setRestaurantDetailVisible(false);
          setRestaurantDetailMatch(null);
        }}
        onMealPress={(meal, match) => {
          setRestaurantDetailVisible(false);
          setRestaurantDetailMatch(null);
          handleMealPress(meal, match);
        }}
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
