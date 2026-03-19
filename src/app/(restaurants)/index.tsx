import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors, Spacing } from '@/constants/theme';
import { useNearbyChains } from '@/hooks/useNearbyChains';
import { useSettings } from '@/hooks/useSettings';
import { useFilters } from '@/hooks/useFilters';
import { useProfile } from '@/hooks/useProfile';
import { useModalData } from '@/hooks/useModalData';
import { useLocation } from '@/hooks/useLocation';
import { RestaurantCard } from '@/components/RestaurantCard';
import { MealImage } from '@/components/MealImage';
import { GlassButton } from '@/components/GlassButton';
import { Meal, NearbyMatch } from '@/api/types';
import {
  getFeed,
  getCachedFeed,
  type FeedResponse,
  type FeedCombo,
} from '@/api/client';
import { HealthScoreMini } from '@/components/HealthScoreBar';
import { computeHealthScore } from '@/utils/healthScore';
import { filterRestaurants } from '@/utils/filters';
import { posthog } from '@/analytics';
import { getCachedChainMeals, prefetchChainMeals } from '@/hooks/useChainMeals';

const LOADING_PHRASES = [
  'Finding restaurants nearby...',
  'Checking menus...',
  'Sorting by nutrition...',
  'Almost ready...',
];
const FEED_MAX_CHAINS = 50;

function LoadingPhrases({ colors }: { colors: any }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % LOADING_PHRASES.length);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <Image
        source={require('@/../assets/animation/loading.webp')}
        style={styles.loadingAnimation}
        autoplay
      />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        {LOADING_PHRASES[idx]}
      </Text>
    </View>
  );
}

export default function RestaurantsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { settings } = useSettings();
  const { status, restaurants, isLoading, error, retry, requestPermission } =
    useNearbyChains(settings.distanceRadius);
  const { filters, clearFilters, activeFilterCount } = useFilters();
  const { setMeal, setRestaurant, setCombo } = useModalData();
  const { areaName, coords, isLoading: locationLoading } = useLocation();
  const { getDescriptionWithTime, profile } = useProfile();
  const [isPrefetchingMeals, setIsPrefetchingMeals] = useState(false);

  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedRetryToken, setFeedRetryToken] = useState(0);

  const hasMealScopedFilters =
    filters.maxCalories !== null ||
    filters.minProtein !== null ||
    filters.maxCarbs !== null ||
    filters.maxFat !== null;

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurants, filters),
    [restaurants, filters]
  );

  const visibleRestaurants = useMemo(() => {
    if (!hasMealScopedFilters || isPrefetchingMeals) return filteredRestaurants;
    return filteredRestaurants.filter((restaurant) => {
      const cached = getCachedChainMeals(restaurant.chain.id, filters);
      return cached ? cached.meals.length > 0 : true;
    });
  }, [filteredRestaurants, filters, hasMealScopedFilters, isPrefetchingMeals]);

  // Prefetch meals for all visible chains in controlled batches
  useEffect(() => {
    let cancelled = false;
    if (filteredRestaurants.length === 0) {
      setIsPrefetchingMeals(false);
      return;
    }
    if (hasMealScopedFilters) setIsPrefetchingMeals(true);
    const chainIds = filteredRestaurants.map((r) => r.chain.id);
    void prefetchChainMeals(chainIds, filters).finally(() => {
      if (!cancelled) setIsPrefetchingMeals(false);
    });
    return () => { cancelled = true; };
  }, [filteredRestaurants, filters, hasMealScopedFilters]);

  // Fetch AI feed (cached 24h + location-based invalidation)
  const feedRestaurants = useMemo(
    () => filteredRestaurants.slice(0, FEED_MAX_CHAINS),
    [filteredRestaurants],
  );
  const feedChainIds = useMemo(
    () => feedRestaurants.map((restaurant) => restaurant.chain.id),
    [feedRestaurants],
  );
  const feedChainKey = useMemo(
    () => feedChainIds.join(','),
    [feedChainIds],
  );

  useEffect(() => {
    if (!feedChainKey || !coords) {
      setFeed(null);
      setFeedError(null);
      setFeedLoading(false);
      return;
    }

    let cancelled = false;
    const cached = getCachedFeed(feedChainIds, filters.maxCalories ?? undefined, coords.latitude, coords.longitude);
    if (cached) {
      setFeed(cached);
      setFeedError(null);
      setFeedLoading(false);
      return;
    }

    setFeed(null);
    setFeedError(null);
    setFeedLoading(true);
    getFeed({
      chains: feedChainIds,
      description: getDescriptionWithTime(),
      maxCalories: filters.maxCalories ?? undefined,
      latitude: coords.latitude,
      longitude: coords.longitude,
    })
      .then((data) => {
        if (!cancelled) {
          setFeed(data);
          setFeedError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeed(null);
          setFeedError('Could not pick meals for you right now. Please try again.');
        }
      })
      .finally(() => { if (!cancelled) setFeedLoading(false); });

    posthog.capture('feed_requested', {
      chain_count: feedChainIds.length,
      total_nearby_chain_count: filteredRestaurants.length,
      has_calorie_filter: filters.maxCalories != null,
    });

    return () => { cancelled = true; };
  }, [
    feedChainKey,
    feedChainIds,
    coords?.latitude,
    coords?.longitude,
    filters.maxCalories,
    filteredRestaurants.length,
    getDescriptionWithTime,
    feedRetryToken,
  ]);

  // Interleave combos from all categories for variety in a single scroll
  // Takes 1st combo from each category, then 2nd from each, etc.
  const feedCombos = useMemo(() => {
    if (!feed) return [];
    const tagged: { combo: FeedCombo; category: string; score: number }[] = [];
    const maxLen = Math.max(...feed.categories.map((c) => c.combos.length));
    for (let i = 0; i < maxLen; i++) {
      for (const cat of feed.categories) {
        const fc = cat.combos[i];
        if (fc) {
          const s = computeHealthScore(
            { calories: fc.totalCalories, protein: fc.totalProtein, carbs: fc.totalCarbs, fat: fc.totalFat },
            profile.goal,
          ).score;
          tagged.push({ combo: fc, category: cat.name, score: s });
        }
      }
    }
    return tagged;
  }, [feed, profile.goal]);

  const handleFeedComboPress = useCallback((fc: FeedCombo, categoryName: string) => {
    if (fc.meals.length === 0) return;
    const nm = filteredRestaurants.find((r) => r.chain.id === fc.chain.id);
    if (!nm) return;
    posthog.capture('feed_combo_tapped', {
      category: categoryName,
      chain: nm.chain.name,
      meal_count: fc.meals.length,
      calories: fc.totalCalories,
    });
    if (fc.meals.length === 1) {
      setMeal({ ...fc.meals[0], chainId: fc.chain.id }, nm);
      router.push('/(restaurants)/meal-detail');
    } else {
      setCombo({
        chain: nm.chain,
        meals: fc.meals,
        totalCalories: fc.totalCalories,
        totalProtein: fc.totalProtein,
        totalCarbs: fc.totalCarbs,
        totalFat: fc.totalFat,
      }, nm);
      router.push('/(restaurants)/combo-detail');
    }
  }, [filteredRestaurants, setMeal, setCombo, router]);

  const handleMealPress = useCallback((meal: Meal, match: NearbyMatch) => {
    posthog.capture('meal_tapped', {
      source: 'restaurant_list',
      meal_name: meal.name,
      restaurant: match.chain.name,
      calories: meal.calories,
      protein: meal.protein,
    });
    setMeal(meal, match);
    router.push('/(restaurants)/meal-detail');
  }, [setMeal, router]);

  const handleRestaurantPress = useCallback((match: NearbyMatch) => {
    setRestaurant(match);
    router.push('/(restaurants)/restaurant-detail');
  }, [setRestaurant, router]);

  if (status === 'undetermined') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.stateTitle, { color: colors.text }]}>Find Healthy Meals Near You</Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
          healmeal needs your location to find restaurants near you.
        </Text>
        <GlassButton label="Enable Location" onPress={requestPermission} variant="primary" />
      </View>
    );
  }

  if (status === 'denied') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.stateTitle, { color: colors.text }]}>Location Access Denied</Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
          Please enable location in your device settings.
        </Text>
        <GlassButton label="Open Settings" onPress={() => Linking.openSettings()} variant="primary" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={[styles.stateTitle, { color: colors.text }]}>Oops</Text>
        <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>{error}</Text>
        <GlassButton label="Try Again" onPress={retry} variant="primary" />
      </View>
    );
  }

  const showFeedError = !feedLoading && !feedCombos.length && Boolean(feedError);
  const showFeedEmptyState = !feedLoading && !feedError && Boolean(feed) && !feedCombos.length;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: locationLoading ? 'Locating...' : (areaName ?? 'Set Location'),
          headerTransparent: true,
          headerShadowVisible: false,
          headerBlurEffect: undefined,
          unstable_headerLeftItems: () => [
            {
              type: 'button' as const,
              label: 'Location',
              icon: { type: 'sfSymbol' as const, name: 'location.fill' },
              sharesBackground: false,
              onPress: () => router.push('/(restaurants)/location-picker'),
            },
          ],
          unstable_headerRightItems: () => [
            {
              type: 'button' as const,
              label: 'Filter',
              icon: { type: 'sfSymbol' as const, name: 'line.3.horizontal.decrease' },
              sharesBackground: false,
              onPress: () => router.push('/(restaurants)/filter'),
              ...(activeFilterCount > 0 ? { badge: { value: String(activeFilterCount) } } : {}),
            },
          ],
        }}
      />

      {isLoading || (hasMealScopedFilters && isPrefetchingMeals) ? (
        <LoadingPhrases colors={colors} />
      ) : (
      <FlatList
        data={visibleRestaurants}
        keyExtractor={(item) => item.chain.id}
        renderItem={({ item: match }) => (
          <RestaurantCard
            match={match}
            filters={filters}
            onMealPress={handleMealPress}
            onRestaurantPress={handleRestaurantPress}
          />
        )}
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={visibleRestaurants.length === 0 ? styles.emptyList : styles.list}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        initialNumToRender={4}
        maxToRenderPerBatch={3}
        windowSize={5}
        ListHeaderComponent={
          <View>
            {/* AI Feed — single horizontal scroll */}
            {feedCombos.length > 0 && (
              <View style={styles.feedSection}>
                <Text style={[styles.feedTitle, { color: colors.text }]}>For You</Text>
                {feed!.tip ? (
                  <Text style={[styles.feedTip, { color: colors.textSecondary }]}>{feed!.tip}</Text>
                ) : null}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.feedScroll}>
                  {feedCombos.map(({ combo: fc, category, score: comboScore }, idx) => {
                    const nm = filteredRestaurants.find((r) => r.chain.id === fc.chain.id);
                    const distance = nm?.distance ?? 0;
                    const chainName = nm?.chain.name ?? fc.chain.name;
                    const m1 = fc.meals[0];
                    const m2 = fc.meals[1];
                    const drink = fc.drink && fc.drink.toLowerCase() !== 'none' ? fc.drink : null;

                    return (
                      <Pressable
                        key={`feed-${idx}`}
                        onPress={() => handleFeedComboPress(fc, category)}
                        style={({ pressed }) => [
                          styles.feedCard,
                          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.8 : 1 },
                        ]}
                      >
                        {/* Category pill */}
                        <Text style={[styles.feedPill, { color: colors.textSecondary }]} numberOfLines={1}>
                          {category}
                        </Text>

                        {/* Meal photos */}
                        <View style={styles.feedPhotos}>
                          {m1 && <MealImage uri={m1.photo} name={m1.name} style={styles.feedPhoto} />}
                          {m2 && (
                            <>
                              <Text style={[styles.feedPlus, { color: colors.textTertiary }]}>+</Text>
                              <MealImage uri={m2.photo} name={m2.name} style={styles.feedPhoto} />
                            </>
                          )}
                        </View>

                        {/* Meal names */}
                        <Text style={[styles.feedMealNames, { color: colors.text }]} numberOfLines={2}>
                          {fc.meals.map((m) => m.name).join(' + ')}
                        </Text>

                        {/* Drink */}
                        {drink && (
                          <Text style={[styles.feedDrink, { color: colors.textTertiary }]} numberOfLines={1}>
                            + {drink}
                          </Text>
                        )}

                        {/* Health Score */}
                        <HealthScoreMini score={comboScore} colors={colors} />

                        {/* Macros */}
                        <View style={styles.feedMacros}>
                          <Text style={[styles.feedMacroText, { color: colors.textSecondary }]}>
                            {fc.totalCalories} cal
                          </Text>
                          <Text style={[styles.feedMacroText, { color: colors.protein }]}>
                            {fc.totalProtein}g protein
                          </Text>
                        </View>

                        {/* Chain + distance */}
                        <Text style={[styles.feedChain, { color: colors.textTertiary }]} numberOfLines={1}>
                          {chainName}{distance > 0 ? ` · ${distance.toFixed(1)} mi` : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Feed loading */}
            {feedLoading && !feed && (
              <View style={styles.feedLoadingRow}>
                <Image
                  source={require('@/../assets/animation/loading.webp')}
                  style={styles.feedLoadingAnim}
                  autoplay
                />
                <Text style={[styles.feedLoadingText, { color: colors.textSecondary }]}>
                  Picking meals for you...
                </Text>
              </View>
            )}

            {showFeedError && (
              <View style={[styles.feedStatusCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.feedTitle, styles.feedStatusTitle, { color: colors.text }]}>For You</Text>
                <Text style={[styles.feedStatusText, { color: colors.textSecondary }]}>
                  {feedError}
                </Text>
                <GlassButton
                  label="Try Again"
                  size="compact"
                  onPress={() => setFeedRetryToken((value) => value + 1)}
                />
              </View>
            )}

            {showFeedEmptyState && (
              <View style={[styles.feedStatusCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.feedTitle, styles.feedStatusTitle, { color: colors.text }]}>For You</Text>
                <Text style={[styles.feedStatusText, { color: colors.textSecondary }]}>
                  We could not find personalized picks right now. Try again in a moment.
                </Text>
              </View>
            )}

            {/* "Near X" heading */}
            {visibleRestaurants.length > 0 && (
              <Text style={[styles.nearbyHeading, { color: colors.text }]}>
                Near {(areaName?.split(',')[0]) || 'you'}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.stateMessage, { color: colors.textSecondary }]}>
              No restaurants match your filters.
            </Text>
            <GlassButton label="Clear Filters" onPress={clearFilters} />
          </View>
        }
      />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingTop: 16, paddingBottom: 40 },
  emptyList: { flexGrow: 1 },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingAnimation: { width: 100, height: 100 },
  loadingText: { fontSize: 15, fontWeight: '500', marginTop: 12, textAlign: 'center' },
  emptyContainer: { paddingTop: 100, alignItems: 'center', paddingHorizontal: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  stateTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  stateMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },

  // Feed
  feedSection: { marginBottom: 8 },
  feedTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: 4,
  },
  feedTip: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
    marginBottom: 12,
  },
  feedScroll: { paddingHorizontal: Spacing.lg, gap: 12 },
  feedCard: {
    width: 260,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  feedPill: { fontSize: 12, fontWeight: '600' },
  feedPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  feedPhoto: { width: 60, height: 60, borderRadius: 14 },
  feedPlus: { fontSize: 20, fontWeight: '700' },
  feedMealNames: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  feedDrink: { fontSize: 12, fontWeight: '500' },
  feedMacros: { flexDirection: 'row', gap: 8 },
  feedMacroText: { fontSize: 12, fontWeight: '600' },
  feedChain: { fontSize: 12, fontWeight: '500' },
  feedLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
  },
  feedLoadingAnim: { width: 32, height: 32 },
  feedLoadingText: { fontSize: 14, fontWeight: '500' },
  feedStatusCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  feedStatusTitle: {
    paddingHorizontal: 0,
    marginBottom: 0,
    fontSize: 20,
  },
  feedStatusText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

  // Nearby heading
  nearbyHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: Spacing.lg,
    marginTop: 20,
    marginBottom: 4,
  },
});
