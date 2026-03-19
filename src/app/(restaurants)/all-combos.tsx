import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useThemeColors, Spacing } from '@/constants/theme';
import { useNearbyChains } from '@/hooks/useNearbyChains';
import { useSettings } from '@/hooks/useSettings';
import { useFilters } from '@/hooks/useFilters';
import { useModalData } from '@/hooks/useModalData';
import { MealImage } from '@/components/MealImage';
import { Image } from 'expo-image';
import { Meal, NearbyMatch } from '@/api/types';
import { getCombos, type MealCombo } from '@/api/client';
import { filterRestaurants } from '@/utils/filters';

export default function AllCombosScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { settings } = useSettings();
  const { restaurants } = useNearbyChains(settings.distanceRadius);
  const { filters } = useFilters();
  const { setMeal, setRestaurant, setCombo } = useModalData();

  const filteredRestaurants = useMemo(
    () => filterRestaurants(restaurants, filters),
    [restaurants, filters],
  );

  const [combos, setCombos] = useState<MealCombo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (filteredRestaurants.length === 0) return;
    let cancelled = false;
    setLoading(true);
    const chainIds = filteredRestaurants.map((r) => r.chain.id);
    getCombos({
      chains: chainIds,
      maxCalories: filters.maxCalories ? filters.maxCalories * 2 : 1200,
      minProtein: filters.minProtein ?? undefined,
      combosPerChain: 5,
      limit: 50,
    })
      .then((data) => {
        if (!cancelled) {
          // Shuffle for random order
          setCombos(data.sort(() => Math.random() - 0.5));
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filteredRestaurants, filters.maxCalories, filters.minProtein]);

  const handleMealPress = (meal: Meal, match: NearbyMatch) => {
    setMeal(meal, match);
    router.push('/(restaurants)/meal-detail');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Meal Combos',
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
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Image
              source={require('@/../assets/animation/loading.webp')}
              style={styles.loadingAnimation}
              autoplay
            />
          </View>
        ) : combos.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No combos available right now
          </Text>
        ) : (
          combos.map((combo, idx) => {
            const m1 = combo.meals[0];
            const m2 = combo.meals[1];
            if (!m1 || !m2) return null;
            const nearbyMatch = filteredRestaurants.find((r) => r.chain.id === combo.chain.id);
            const distance = nearbyMatch?.distance ?? 0;

            return (
              <Pressable
                key={`${combo.chain.id}-${idx}`}
                onPress={() => {
                  const nm = filteredRestaurants.find((r) => r.chain.id === combo.chain.id);
                  if (nm) { setCombo(combo, nm); router.push('/(restaurants)/combo-detail'); }
                }}
                style={({ pressed }) => [
                  styles.comboRow,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={styles.comboPhotos}>
                  <MealImage uri={m1.photo} name={m1.name} style={styles.comboPhoto} />
                  <Text style={[styles.comboPlus, { color: colors.textTertiary }]}>+</Text>
                  <MealImage uri={m2.photo} name={m2.name} style={styles.comboPhoto} />
                </View>
                <View style={styles.comboInfo}>
                  <Text style={[styles.comboNames, { color: colors.text }]} numberOfLines={2}>
                    {m1.name} + {m2.name}
                  </Text>
                  <Text style={[styles.comboMacros, { color: colors.textTertiary }]}>
                    {combo.totalCalories} cal · {combo.totalProtein}g protein
                  </Text>
                  <Text style={[styles.comboChain, { color: colors.textTertiary }]}>
                    {combo.chain.name}{distance > 0 ? ` · ${distance.toFixed(1)} mi` : ''}
                  </Text>
                </View>
                <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>

    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  loadingAnimation: { width: 80, height: 80 },
  emptyText: { textAlign: 'center', paddingTop: 60, fontSize: 15 },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  comboPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comboPhoto: { width: 44, height: 44, borderRadius: 10 },
  comboPlus: { fontSize: 16, fontWeight: '700' },
  comboInfo: { flex: 1, gap: 2 },
  comboNames: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  comboMacros: { fontSize: 12, fontWeight: '500' },
  comboChain: { fontSize: 11, fontWeight: '500' },
  chevron: { fontSize: 20, fontWeight: '300' },
});
