import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  ActionSheetIOS,
  Platform,
  StyleSheet,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors, Spacing } from '@/constants/theme';
import { MealImage } from '@/components/MealImage';
import { useModalData } from '@/hooks/useModalData';
import { Meal, NearbyMatch } from '@/api/types';
import { type ComboMeal } from '@/api/client';
import { posthog } from '@/analytics';

const DELIVERY_LABELS: Record<string, string> = {
  uberEats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  doordash: 'DoorDash',
};

export default function ComboDetailScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { getCombo, setMeal, setRestaurant } = useModalData();
  const { combo, match: nearbyMatch } = getCombo();

  if (!combo || combo.meals.length === 0) return null;

  const distance = nearbyMatch?.distance ?? 0;
  const deliveryLinks = nearbyMatch
    ? Object.entries(nearbyMatch.chain.deliveryLinks).filter(([, url]) => url)
    : [];

  const openDirections = () => {
    if (!nearbyMatch) return;
    const { latitude, longitude } = nearbyMatch;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Apple Maps', 'Google Maps', 'Waze'], cancelButtonIndex: 0 },
        (index) => {
          if (index > 0) posthog.capture('directions_opened', { restaurant: combo.chain.name, map_app: ['', 'apple_maps', 'google_maps', 'waze'][index] });
          if (index === 1) Linking.openURL(`maps://?daddr=${latitude},${longitude}`);
          else if (index === 2) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
          else if (index === 3) Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`).catch(() => Linking.openURL('https://apps.apple.com/app/waze/id323229106'));
        },
      );
    } else {
      posthog.capture('directions_opened', { restaurant: combo.chain.name, map_app: 'google_maps' });
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
    }
  };

  const handleMealPress = (cm: ComboMeal) => {
    if (!nearbyMatch) return;
    const meal: Meal = {
      id: cm.id,
      chainId: combo.chain.id,
      name: cm.name,
      category: cm.category,
      photo: cm.photo,
      calories: cm.calories,
      protein: cm.protein,
      carbs: cm.carbs,
      fat: cm.fat,
    };
    setMeal(meal, nearbyMatch);
    router.push('/(restaurants)/meal-detail');
  };

  const handleViewRestaurant = () => {
    if (!nearbyMatch) return;
    setRestaurant(nearbyMatch);
    router.push('/(restaurants)/restaurant-detail');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Meal Combo',
          headerTransparent: true,
          headerShadowVisible: false,
          headerBlurEffect: undefined,
          unstable_headerLeftItems: () => [
            {
              type: 'button' as const,
              label: 'Back',
              icon: { type: 'sfSymbol' as const, name: 'chevron.left' },
              sharesBackground: false,
              onPress: () => router.back(),
            },
          ],
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant — tappable */}
        <Pressable onPress={handleViewRestaurant} style={({ pressed }) => [styles.restaurantRow, { opacity: pressed ? 0.6 : 1 }]}>
          <Text style={[styles.restaurantName, { color: colors.text }]}>{combo.chain.name}</Text>
          <Text style={[styles.restaurantMeta, { color: colors.textSecondary }]}>
            {distance > 0 ? `${distance.toFixed(1)} mi · ` : ''}{combo.chain.cuisine} ›
          </Text>
        </Pressable>

        {/* Meals */}
        {combo.meals.map((meal, index) => (
          <React.Fragment key={meal.id}>
            {index > 0 && (
              <Text style={[styles.plus, { color: colors.textTertiary }]}>+</Text>
            )}
            <Pressable
              onPress={() => handleMealPress(meal)}
              style={({ pressed }) => [styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.8 : 1 }]}
            >
              <MealImage uri={meal.photo} name={meal.name} style={styles.mealImage} />
              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                <Text style={[styles.mealMacros, { color: colors.textTertiary }]}>
                  {meal.calories} cal · {meal.protein}p · {meal.carbs}c · {meal.fat}f
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
            </Pressable>
          </React.Fragment>
        ))}

        {/* Combined totals */}
        <View style={[styles.totals, { borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.totalsLabel, { color: colors.textSecondary }]}>Combined</Text>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalValue, { color: colors.text }]}>{combo.totalCalories} cal</Text>
            <Text style={[styles.totalValue, { color: colors.protein }]}>{combo.totalProtein}g protein</Text>
            <Text style={[styles.totalValue, { color: colors.carbs }]}>{combo.totalCarbs}g carbs</Text>
            <Text style={[styles.totalValue, { color: colors.fat }]}>{combo.totalFat}g fat</Text>
          </View>
        </View>

        {/* Drink tip */}
        <View style={[styles.drinkTip, { backgroundColor: 'rgba(34,166,84,0.06)' }]}>
          <Text style={styles.drinkTipIcon}>💧</Text>
          <Text style={[styles.drinkTipText, { color: colors.textSecondary }]}>
            Complete your meal with water, sparkling water, or a zero-calorie drink
          </Text>
        </View>

        {/* Map */}
        {nearbyMatch && nearbyMatch.latitude !== 0 && (
          <Pressable onPress={openDirections} style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: nearbyMatch.latitude,
                longitude: nearbyMatch.longitude,
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
                coordinate={{ latitude: nearbyMatch.latitude, longitude: nearbyMatch.longitude }}
                title={combo.chain.name}
              />
            </MapView>
          </Pressable>
        )}

        {/* Delivery pills */}
        {deliveryLinks.length > 0 && (
          <View style={styles.deliveryRow}>
            {deliveryLinks.map(([key, url]) => (
              <Pressable
                key={key}
                onPress={() => {
                  posthog.capture('delivery_tapped', { restaurant: combo.chain.name, service: key });
                  Linking.openURL(url!).catch(() => {});
                }}
                style={({ pressed }) => [styles.deliveryPill, { borderColor: colors.surfaceBorder, opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.deliveryPillText, { color: colors.textSecondary }]}>
                  {DELIVERY_LABELS[key] || key}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40, gap: 12 },
  restaurantRow: { paddingHorizontal: Spacing.lg, marginBottom: 4 },
  restaurantName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  restaurantMeta: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  mealCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, gap: 12, marginHorizontal: Spacing.lg },
  mealImage: { width: 64, height: 64, borderRadius: 12 },
  mealInfo: { flex: 1, gap: 4 },
  mealName: { fontSize: 17, fontWeight: '600' },
  mealMacros: { fontSize: 13, fontWeight: '500' },
  chevron: { fontSize: 20, fontWeight: '300' },
  plus: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  totals: { paddingTop: 16, paddingHorizontal: Spacing.lg, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  totalsLabel: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  totalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  totalValue: { fontSize: 16, fontWeight: '700' },
  drinkTip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, marginHorizontal: Spacing.lg },
  drinkTipIcon: { fontSize: 20 },
  drinkTipText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  mapContainer: { borderRadius: 14, overflow: 'hidden', marginHorizontal: Spacing.lg, marginTop: 4 },
  map: { width: '100%', height: 120 },
  deliveryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg },
  deliveryPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  deliveryPillText: { fontSize: 13, fontWeight: '500' },
});
