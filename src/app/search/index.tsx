import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useModalData } from '@/hooks/useModalData';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { posthog } from '@/analytics';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MealImage } from '@/components/MealImage';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors, Spacing } from '@/constants/theme';
import { useNearbyChains } from '@/hooks/useNearbyChains';
import { useSettings } from '@/hooks/useSettings';
import { useFilters } from '@/hooks/useFilters';
import { useSearchMeals, type SearchResult } from '@/hooks/useSearchMeals';
import { GlassButton } from '@/components/GlassButton';
import { Meal, NearbyMatch } from '@/api/types';
import { SearchMeal } from '@/api/client';
import { filterRestaurants } from '@/utils/filters';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 12;
const GRID_PADDING = Spacing.lg;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

const LOADING_PHRASES = [
  'Finding restaurants nearby...',
  'Scanning menus for you...',
  'Sorting by protein...',
  'Matching your preferences...',
  'Almost there...',
];

function LoadingPhrases({ colors }: { colors: any }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % LOADING_PHRASES.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={[styles.screen, styles.loadingContainer, { backgroundColor: colors.background }]}>
      <Image
        source={require('@/../assets/animation/loading.webp')}
        style={styles.loadingAnimation}
        autoplay
      />
      <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 12 }]}>
        {LOADING_PHRASES[idx]}
      </Text>
    </View>
  );
}

const MealGridCard = React.memo(function MealGridCard({
  item,
  onPress,
}: {
  item: SearchResult;
  onPress: (meal: SearchMeal, match: NearbyMatch | null) => void;
}) {
  const colors = useThemeColors();
  const { meal, match } = item;

  return (
    <Pressable
      onPress={() => onPress(meal, match)}
      style={({ pressed }) => [
        styles.card,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <MealImage uri={meal.photo} name={meal.name} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={[styles.cardRestaurant, { color: colors.textSecondary }]} numberOfLines={1}>
          {meal.chainName}{match && match.distance > 0 ? ` · ${match.distance.toFixed(1)} mi` : ''}
        </Text>
        <Text style={[styles.cardMacros, { color: colors.textTertiary }]}>
          {meal.calories} cal · {meal.protein}p · {meal.carbs}c · {meal.fat}f
        </Text>
      </View>
    </Pressable>
  );
});

export default function MealsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { settings } = useSettings();
  const {
    status,
    restaurants,
    isLoading: chainsLoading,
    error,
    retry,
    requestPermission,
  } = useNearbyChains(settings.distanceRadius);
  const { filters, clearFilters, activeFilterCount } = useFilters();
  const { setMeal, setRestaurant, getPendingSearch } = useModalData();
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantFilter, setRestaurantFilter] = useState<string | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      const pending = getPendingSearch();
      if (pending) setRestaurantFilter(pending);
    }
  }, [isFocused, getPendingSearch]);

  const totalFilterCount = activeFilterCount + (restaurantFilter ? 1 : 0);

  // Server-side search
  const { results, total, hasMore, isLoading: searchLoading, loadMore } = useSearchMeals(
    searchQuery,
    restaurants,
    filters,
    restaurantFilter,
  );

  // Client-side restaurant matching for combined search
  const matchedRestaurants = useMemo(() => {
    if (!searchQuery.trim() || restaurantFilter) return [];
    const q = searchQuery.toLowerCase().trim();
    return filterRestaurants(restaurants, filters).filter(
      (r) =>
        r.chain.name.toLowerCase().includes(q) ||
        r.chain.cuisine.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [searchQuery, restaurants, filters, restaurantFilter]);

  const handleRestaurantPress = useCallback((match: NearbyMatch) => {
    posthog.capture('restaurant_tapped', {
      source: 'search',
      restaurant: match.chain.name,
      query: searchQuery.trim(),
    });
    setRestaurant(match);
    router.push('/search/restaurant-detail');
  }, [setRestaurant, router, searchQuery]);

  const isLoading = chainsLoading || (searchLoading && results.length === 0);
  const trimmedQuery = searchQuery.trim();
  const hasTextQuery = trimmedQuery.length > 0;
  const hasSearchFilters = totalFilterCount > 0;
  const hasSearchIntent = hasTextQuery || hasSearchFilters;
  const searchMode = hasTextQuery
    ? (hasSearchFilters ? 'query_and_filter' : 'query')
    : 'filter_only';
  const searchAnalyticsKeyRef = useRef('');
  const searchNoResultsKeyRef = useRef('');
  const nearbyChainScopeKey = useMemo(
    () => restaurants.map((restaurant) => restaurant.chain.id).sort().join(','),
    [restaurants],
  );

  const searchCriteriaSignature = useMemo(() => JSON.stringify({
    query: trimmedQuery,
    restaurantFilter,
    nearbyChainScopeKey,
    sort: filters.sort,
    maxCalories: filters.maxCalories,
    minProtein: filters.minProtein,
    maxCarbs: filters.maxCarbs,
    maxFat: filters.maxFat,
  }), [
    trimmedQuery,
    restaurantFilter,
    nearbyChainScopeKey,
    filters.sort,
    filters.maxCalories,
    filters.minProtein,
    filters.maxCarbs,
    filters.maxFat,
  ]);

  const searchAnalyticsProps = useMemo(() => ({
    query: hasTextQuery ? trimmedQuery : null,
    has_query: hasTextQuery,
    search_mode: searchMode,
    restaurant_filter: restaurantFilter,
    filter_count: totalFilterCount,
    nearby_chain_count: restaurants.length,
    sort: filters.sort,
    max_calories: filters.maxCalories,
    min_protein: filters.minProtein,
    max_carbs: filters.maxCarbs,
    max_fat: filters.maxFat,
  }), [
    hasTextQuery,
    trimmedQuery,
    searchMode,
    restaurantFilter,
    totalFilterCount,
    restaurants.length,
    filters.sort,
    filters.maxCalories,
    filters.minProtein,
    filters.maxCarbs,
    filters.maxFat,
  ]);

  useEffect(() => {
    if (!hasSearchIntent) {
      searchAnalyticsKeyRef.current = '';
      searchNoResultsKeyRef.current = '';
      return;
    }
    if (status !== 'granted' || chainsLoading || searchLoading) return;

    const eventKey = `${searchCriteriaSignature}:${total}`;
    if (searchAnalyticsKeyRef.current === eventKey) return;
    searchAnalyticsKeyRef.current = eventKey;

    const eventProps = {
      ...searchAnalyticsProps,
      results_count: total,
      has_results: total > 0,
    };

    posthog.capture('search_performed', eventProps);
    if (total === 0 && searchNoResultsKeyRef.current !== searchCriteriaSignature) {
      searchNoResultsKeyRef.current = searchCriteriaSignature;
      posthog.capture('search_no_results', eventProps);
    } else if (total > 0) {
      searchNoResultsKeyRef.current = '';
    }
  }, [
    hasSearchIntent,
    status,
    chainsLoading,
    searchLoading,
    searchCriteriaSignature,
    searchAnalyticsProps,
    total,
  ]);

  const handleMealPress = useCallback((meal: SearchMeal, match: NearbyMatch | null) => {
    posthog.capture('meal_tapped', {
      source: 'search',
      meal_name: meal.name,
      restaurant: meal.chainName,
      calories: meal.calories,
      protein: meal.protein,
      ...searchAnalyticsProps,
    });
    posthog.capture('search_result_tapped', {
      meal_name: meal.name,
      restaurant: meal.chainName,
      results_count: total,
      ...searchAnalyticsProps,
    });

    // Build a Meal object for the detail sheet
    const mealObj: Meal = {
      id: meal.id,
      chainId: meal.chainId,
      name: meal.name,
      category: meal.category,
      photo: meal.photo,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    };

    // Use the real NearbyMatch if available, otherwise build a minimal one
    const matchObj: NearbyMatch = match ?? {
      chain: {
        id: meal.chainId,
        name: meal.chainName,
        logo: meal.chainLogo,
        cuisine: '',
        country: '',
        approximate: false,
        website: '',
        mealCount: 0,
        deliveryLinks: {},
        meals: [],
      },
      distance: 0,
      latitude: 0,
      longitude: 0,
      address: '',
    };

    setMeal(mealObj, matchObj);
    router.push('/search/meal-detail');
  }, [setMeal, router, searchAnalyticsProps, total]);

  const renderItem = useCallback(({ item }: { item: SearchResult }) => (
    <MealGridCard item={item} onPress={handleMealPress} />
  ), [handleMealPress]);

  const keyExtractor = useCallback(
    (item: SearchResult) => `${item.meal.chainId}-${item.meal.id}`,
    []
  );

  const onEndReached = useCallback(() => {
    if (hasMore && !searchLoading) loadMore();
  }, [hasMore, searchLoading, loadMore]);

  const ListHeader = useMemo(() => {
    return (
      <>
        {/* Matched restaurants */}
        {matchedRestaurants.length > 0 && (
          <View style={styles.restaurantSection}>
            <Text style={[styles.restaurantSectionTitle, { color: colors.textSecondary }]}>
              Restaurants
            </Text>
            <FlatList
              data={matchedRestaurants}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.chain.id}
              contentContainerStyle={styles.restaurantScroll}
              renderItem={({ item: match }) => (
                <Pressable
                  onPress={() => handleRestaurantPress(match)}
                  style={({ pressed }) => [
                    styles.restaurantCard,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  {match.chain.logo ? (
                    <Image source={{ uri: match.chain.logo }} style={styles.restaurantLogo} contentFit="contain" />
                  ) : (
                    <View style={[styles.restaurantLogo, { backgroundColor: colors.surfaceBorder, borderRadius: 10 }]} />
                  )}
                  <Text style={[styles.restaurantCardName, { color: colors.text }]} numberOfLines={1}>
                    {match.chain.name}
                  </Text>
                  <Text style={[styles.restaurantCardMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                    {match.chain.cuisine} · {match.distance.toFixed(1)} mi
                  </Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Restaurant filter chip */}
        {restaurantFilter && (
          <Pressable
            onPress={() => setRestaurantFilter(null)}
            style={[styles.filterChip, { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder }]}
          >
            <Text style={[styles.filterChipText, { color: colors.brandGreen }]}>{restaurantFilter}</Text>
            <SymbolView name="xmark.circle.fill" size={14} tintColor={colors.brandGreen} />
          </Pressable>
        )}

        {/* Meals section title when restaurants are shown */}
        {matchedRestaurants.length > 0 && results.length > 0 && (
          <Text style={[styles.mealsSectionTitle, { color: colors.textSecondary }]}>
            Meals
          </Text>
        )}
      </>
    );
  }, [restaurantFilter, matchedRestaurants, results.length, colors, handleRestaurantPress]);

  const ListFooter = useMemo(() => {
    if (!searchLoading || results.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.textTertiary} />
      </View>
    );
  }, [searchLoading, results.length, colors]);

  if (status === 'undetermined') {
    return (
      <View style={[styles.screen, styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Enable location to browse meals near you.
        </Text>
        <GlassButton label="Enable Location" onPress={requestPermission} variant="primary" />
      </View>
    );
  }

  if (status === 'denied') {
    return (
      <View style={[styles.screen, styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Please enable location access in Settings to search nearby meals.
        </Text>
        <GlassButton label="Open Settings" onPress={() => Linking.openSettings()} variant="primary" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{error}</Text>
        <GlassButton label="Try Again" onPress={retry} variant="primary" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerTransparent: true,
          headerShadowVisible: false,
          headerBlurEffect: undefined,
          unstable_headerRightItems: () => [
            {
              type: 'button' as const,
              label: 'Filter',
              icon: { type: 'sfSymbol' as const, name: 'line.3.horizontal.decrease' },
              sharesBackground: false,
              onPress: () => router.push('/search/filter'),
              ...(totalFilterCount > 0 ? { badge: { value: String(totalFilterCount) } } : {}),
            },
          ],
        }}
      />

      <Stack.SearchBar
        placeholder="Search meals or restaurants..."
        onChangeText={(e) => setSearchQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearchQuery('')}
      />

      {chainsLoading && results.length === 0 ? (
        <LoadingPhrases colors={colors} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          style={[styles.screen, { backgroundColor: colors.background }]}
          contentContainerStyle={results.length === 0 ? styles.emptyList : styles.list}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={7}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={colors.textTertiary} />
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.hint, { color: colors.textSecondary }]}>
                  {searchQuery.trim()
                    ? `No meals matching "${searchQuery}"`
                    : 'No meals match your filters.'}
                </Text>
                {!searchQuery.trim() && activeFilterCount > 0 && (
                  <GlassButton label="Clear Filters" onPress={clearFilters} />
                )}
              </View>
            )
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingTop: 8, paddingBottom: 40, paddingHorizontal: GRID_PADDING },
  emptyList: { flexGrow: 1, paddingHorizontal: GRID_PADDING },
  columnWrapper: { gap: GRID_GAP, marginBottom: GRID_GAP },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  phraseContainer: {
    height: 30,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  hint: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  card: {
    width: CARD_WIDTH,
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH * 0.72,
    borderRadius: 14,
  },
  cardInfo: {
    paddingTop: 8,
    paddingBottom: 6,
    gap: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardRestaurant: {
    fontSize: 12,
    fontWeight: '400',
  },
  cardMacros: {
    fontSize: 11,
    fontWeight: '500',
  },
  // Restaurant search results
  restaurantSection: {
    marginBottom: 16,
  },
  restaurantSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  restaurantScroll: {
    gap: 10,
  },
  restaurantCard: {
    width: 140,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  restaurantLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  restaurantCardName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  restaurantCardMeta: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  mealsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
});
