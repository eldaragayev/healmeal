import React, { useEffect, useState, useCallback } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import MapView, { Marker } from 'react-native-maps';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { MealBadges } from './MealBadges';
import { MealImage } from './MealImage';
import { NearbyMatch, Meal, getSortOrder } from '@/api/types';
import { SymbolView } from 'expo-symbols';
import { getChainMeals } from '@/api/client';
import { useFilters } from '@/hooks/useFilters';
import { reportRestaurant } from '@/utils/report';
import { posthog } from '@/analytics';

interface RestaurantDetailProps {
  match: NearbyMatch | null;
  visible: boolean;
  onClose: () => void;
  onMealPress?: (meal: Meal, match: NearbyMatch) => void;
  onViewAllMeals?: () => void;
  onGetRecommendations?: () => void;
}

const DELIVERY_LABELS: Record<string, string> = {
  uberEats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  doordash: 'DoorDash',
};

function GlowingComboButton({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value * 0.5,
  }));

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Animated.View style={[styles.comboButton, glowStyle]}>
        {Platform.OS === 'ios' ? (
          <SymbolView name={'sparkles' as any} style={{ width: 18, height: 18 }} tintColor="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16 }}>✨</Text>
        )}
        <Text style={styles.comboButtonText}>What Should I Order?</Text>
      </Animated.View>
    </Pressable>
  );
}

export function RestaurantDetail({ match, visible, onClose, onMealPress, onViewAllMeals, onGetRecommendations }: RestaurantDetailProps) {
  const colors = useThemeColors();
  const { filters } = useFilters();

  const [meals, setMeals] = useState<Meal[]>([]);
  const [totalMeals, setTotalMeals] = useState(0);
  const [loadingMeals, setLoadingMeals] = useState(true);

  // Analytics — only fires once per restaurant visit
  useEffect(() => {
    if (match) {
      posthog.capture('restaurant_viewed', {
        restaurant: match.chain.name,
        cuisine: match.chain.cuisine,
        distance: match.distance,
      });
    }
  }, [match?.chain.id]);

  // Fetch meals — re-runs when chain or filters change
  useEffect(() => {
    if (!match) return;
    let cancelled = false;
    setLoadingMeals(true);
    setMeals([]);
    getChainMeals(match.chain.id, {
        limit: 10,
        offset: 0,
        sort: filters.sort,
        order: getSortOrder(filters.sort),
        maxCalories: filters.maxCalories ?? undefined,
        minProtein: filters.minProtein ?? undefined,
        maxCarbs: filters.maxCarbs ?? undefined,
        maxFat: filters.maxFat ?? undefined,
      })
      .then(({ meals: m, total }) => {
        if (cancelled) return;
        setMeals(m);
        setTotalMeals(total);
        setLoadingMeals(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setTotalMeals(match.chain.mealCount);
        setLoadingMeals(false);
      });
    return () => { cancelled = true; };
  }, [match?.chain.id, filters.sort, filters.maxCalories, filters.minProtein, filters.maxCarbs, filters.maxFat]);

  if (!match) return null;

  const deliveryLinks = Object.entries(match.chain.deliveryLinks).filter(([, url]) => url);
  const hasMore = totalMeals > 10;

  const openDirections = () => {
    const { latitude, longitude } = match;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Apple Maps', 'Google Maps', 'Waze'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) Linking.openURL(`maps://?daddr=${latitude},${longitude}`);
          else if (index === 2) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
          else if (index === 3) Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`).catch(() => Linking.openURL('https://apps.apple.com/app/waze/id323229106'));
        }
      );
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Restaurant header */}
      <View style={styles.restaurantHeader}>
        <Text style={[styles.restaurantName, { color: colors.text }]}>
          {match.chain.name}
        </Text>
        <Text style={[styles.restaurantMeta, { color: colors.textSecondary }]}>
          {match.distance > 0 ? `${match.distance.toFixed(1)} mi · ` : ''}{match.chain.cuisine}
          {match.address ? ` · ${match.address}` : ''}
          {match.chain.approximate ? '\nBased on US menu' : ''}
        </Text>
        <Pressable
          onPress={() => reportRestaurant(match.chain.name)}
          style={({ pressed }) => [styles.reportRow, { opacity: pressed ? 0.5 : 1 }]}
        >
          {Platform.OS === 'ios' ? (
            <SymbolView name={'flag' as any} style={{ width: 14, height: 14 }} tintColor={colors.textTertiary} />
          ) : null}
          <Text style={[styles.reportText, { color: colors.textTertiary }]}>Report an issue</Text>
        </Pressable>
      </View>

      {/* Map — tappable for directions */}
      <Pressable onPress={openDirections} style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: match.latitude,
            longitude: match.longitude,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          pointerEvents="none"
        >
          <Marker
            coordinate={{ latitude: match.latitude, longitude: match.longitude }}
            title={match.chain.name}
          />
        </MapView>
      </Pressable>

      {/* Delivery pills */}
      {deliveryLinks.length > 0 && (
        <View style={styles.deliveryRow}>
          {deliveryLinks.map(([key, url]) => (
            <Pressable
              key={key}
              onPress={() => {
                posthog.capture('delivery_tapped', { restaurant: match.chain.name, service: key });
                Linking.openURL(url!).catch(() => {});
              }}
              style={({ pressed }) => [
                styles.deliveryPill,
                { borderColor: colors.surfaceBorder, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.deliveryPillText, { color: colors.textSecondary }]}>
                {DELIVERY_LABELS[key] || key}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* AI Recommendations button */}
      {onGetRecommendations && (
        <GlowingComboButton onPress={onGetRecommendations} />
      )}

      {/* Menu header */}
      <View style={styles.menuHeader}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>Menu</Text>
        {hasMore && onViewAllMeals && (
          <Pressable onPress={onViewAllMeals} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={[styles.viewAllText, { color: colors.brandGreen }]}>
              All {totalMeals} meals {'\u203A'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Meal rows */}
      {loadingMeals && (
        <View style={styles.loadingMeals}>
          <Image source={require('@/../assets/animation/loading.webp')} style={styles.loadingMascot} autoplay />
        </View>
      )}
      {!loadingMeals && meals.length === 0 && (
        <Text style={[styles.emptyMenu, { color: colors.textTertiary }]}>
          Menu not available right now
        </Text>
      )}
      {meals.map((meal, index) => (
        <Pressable
          key={meal.id}
          onPress={() => {
            posthog.capture('meal_tapped', {
              source: 'restaurant_detail',
              meal_name: meal.name,
              restaurant: match.chain.name,
              calories: meal.calories,
              protein: meal.protein,
              position: index + 1,
            });
            onMealPress?.(meal, match);
          }}
          style={({ pressed }) => [
            styles.mealRow,
            { borderBottomColor: colors.surfaceBorder, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <MealImage uri={meal.photo} name={meal.name} style={styles.mealImage} />
          <View style={styles.mealInfo}>
            <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>{meal.name}</Text>
            <Text style={[styles.mealMacros, { color: colors.textTertiary }]}>
              {meal.calories} cal · {meal.protein}p · {meal.carbs}c · {meal.fat}f
            </Text>
            <MealBadges meal={meal} compact />
          </View>
          <Text style={[styles.chevron, { color: colors.textTertiary }]}>{'\u203A'}</Text>
        </Pressable>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  restaurantHeader: { paddingHorizontal: Spacing.lg, paddingTop: 16, marginBottom: 24 },
  restaurantName: { ...Typography.title, lineHeight: 38 },
  restaurantMeta: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  reportText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mapContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: { width: '100%', height: 180 },
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    marginBottom: 24,
  },
  deliveryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  deliveryPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
  },
  menuTitle: {
    ...Typography.heading,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  mealImage: { width: 52, height: 52, borderRadius: 10 },
  mealInfo: { flex: 1, gap: 2 },
  mealName: { fontSize: 15, fontWeight: '600' },
  mealMacros: { fontSize: 12, fontWeight: '500' },
  chevron: { fontSize: 20, fontWeight: '300' },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingMeals: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMascot: {
    width: 60,
    height: 60,
  },
  emptyMenu: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 24,
  },
  comboButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: Spacing.lg,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#22a654',
    shadowColor: '#22a654',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
  },
  comboButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
