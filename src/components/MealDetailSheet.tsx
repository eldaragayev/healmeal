import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActionSheetIOS,
  Platform,
  ScrollView,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import MapView, { Marker } from 'react-native-maps';
import { useThemeColors, Spacing } from '@/constants/theme';
import { MealBadges } from './MealBadges';
import { MealImage } from './MealImage';
import { HealthScoreBar } from './HealthScoreBar';
import { Meal, NearbyMatch } from '@/api/types';
import { computeHealthScore } from '@/utils/healthScore';
import { useProfile } from '@/hooks/useProfile';
import { posthog } from '@/analytics';
import { reportMeal } from '@/utils/report';

interface MealDetailSheetProps {
  meal: Meal | null;
  match: NearbyMatch | null;
  visible: boolean;
  onClose: () => void;
  onViewRestaurant?: () => void;
}

const DELIVERY_LABELS: Record<string, string> = {
  uberEats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  doordash: 'DoorDash',
};

export function MealDetailSheet({ meal, match, visible, onClose, onViewRestaurant }: MealDetailSheetProps) {
  const colors = useThemeColors();
  const { profile } = useProfile();
  const scoreResult = useMemo(
    () => meal ? computeHealthScore(meal, profile.goal) : null,
    [meal?.calories, meal?.protein, meal?.carbs, meal?.fat, profile.goal],
  );

  useEffect(() => {
    if (meal && match) {
      posthog.capture('meal_viewed', {
        meal_name: meal.name,
        meal_id: meal.id,
        restaurant: match.chain.name,
        cuisine: match.chain.cuisine,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        distance: match.distance,
        $set_once: { first_meal_viewed_at: new Date().toISOString() },
      });
    }
  }, [meal?.id]);

  const openDirections = useCallback(() => {
    if (!match) return;
    const { latitude, longitude } = match;
    if (Platform.OS === 'ios') {
      const mapApps = [null, 'apple_maps', 'google_maps', 'waze'];
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Apple Maps', 'Google Maps', 'Waze'], cancelButtonIndex: 0 },
        (index) => {
          if (index > 0) posthog.capture('directions_opened', { restaurant: match.chain.name, map_app: mapApps[index], $set_once: { first_directions_at: new Date().toISOString() } });
          if (index === 1) Linking.openURL(`maps://?daddr=${latitude},${longitude}`);
          else if (index === 2) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
          else if (index === 3) Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`).catch(() => Linking.openURL('https://apps.apple.com/app/waze/id323229106'));
        }
      );
    } else {
      posthog.capture('directions_opened', { restaurant: match.chain.name, map_app: 'google_maps', $set_once: { first_directions_at: new Date().toISOString() } });
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
    }
  }, [match]);

  if (!meal || !match) return null;

  const deliveryLinks = Object.entries(match.chain.deliveryLinks).filter(([, url]) => url);

  return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero image */}
          <MealImage uri={meal.photo} name={meal.name} style={styles.heroImage} />

          {/* Meal name + badges */}
          <View style={styles.nameSection}>
            <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
            <MealBadges meal={meal} />
          </View>

          {/* Restaurant name + distance — tappable */}
          <Pressable
            onPress={onViewRestaurant}
            style={({ pressed }) => [styles.restaurantRow, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.restaurantInfo, { color: colors.textSecondary }]}>
              {match.chain.name} · {match.distance.toFixed(1)} mi
            </Text>
            {onViewRestaurant && (
              <Text style={[styles.restaurantChevron, { color: colors.textTertiary }]}>{'\u203A'}</Text>
            )}
          </Pressable>

          {/* Health Score bar — tappable for breakdown */}
          {scoreResult && <HealthScoreBar result={scoreResult} />}

          {/* Nutrition — clean horizontal row */}
          <View style={[styles.nutritionRow, { borderColor: colors.surfaceBorder }]}>
            <NutritionItem label="Calories" value={`${meal.calories}`} color={colors.text} />
            <View style={[styles.nutritionDivider, { backgroundColor: colors.surfaceBorder }]} />
            <NutritionItem label="Protein" value={`${meal.protein}g`} color={colors.protein} />
            <View style={[styles.nutritionDivider, { backgroundColor: colors.surfaceBorder }]} />
            <NutritionItem label="Carbs" value={`${meal.carbs}g`} color={colors.carbs} />
            <View style={[styles.nutritionDivider, { backgroundColor: colors.surfaceBorder }]} />
            <NutritionItem label="Fat" value={`${meal.fat}g`} color={colors.fat} />
          </View>

          {/* Inline map preview — tap for directions */}
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

          {/* Report button */}
          <Pressable
            onPress={() => reportMeal(meal.name, match.chain.name)}
            style={({ pressed }) => [styles.reportRow, { opacity: pressed ? 0.5 : 1 }]}
          >
            {Platform.OS === 'ios' ? (
              <SymbolView name={'flag' as any} style={{ width: 14, height: 14 }} tintColor={colors.textTertiary} />
            ) : null}
            <Text style={[styles.reportText, { color: colors.textTertiary }]}>Report an issue</Text>
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
      </ScrollView>
  );
}

function NutritionItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.nutritionItem}>
      <Text style={[styles.nutritionValue, { color }]}>{value}</Text>
      <Text style={[styles.nutritionLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 0,
  },
  nameSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 20,
    paddingBottom: 4,
    gap: 8,
  },
  mealName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 16,
    gap: 4,
  },
  restaurantInfo: {
    fontSize: 15,
    fontWeight: '500',
  },
  restaurantChevron: {
    fontSize: 18,
    fontWeight: '400',
  },
  nutritionRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  nutritionDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  mapContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 120,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.lg,
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
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  reportText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
