import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { useThemeColors, Spacing, Typography } from '@/constants/theme';
import { useModalData } from '@/hooks/useModalData';
import { useProfile } from '@/hooks/useProfile';
import { useFilters } from '@/hooks/useFilters';
import { MealImage } from '@/components/MealImage';
import { MealBadges } from '@/components/MealBadges';
import { posthog } from '@/analytics';
import {
  getRecommendations,
  getCachedRecommendation,
  type RecommendationResponse,
  type RecommendationCombo,
  type RecommendationCategory,
} from '@/api/client';

export default function RestaurantRecommendationsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { getRestaurant, setMeal, setCombo } = useModalData();
  const { getDescriptionWithTime } = useProfile();
  const { filters } = useFilters();
  const match = getRestaurant();

  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;
    let cancelled = false;

    // Check cache first
    const cached = getCachedRecommendation(match.chain.id);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getRecommendations({
      chain: match.chain.id,
      description: getDescriptionWithTime(),
      maxCalories: filters.maxCalories ?? undefined,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load recommendations right now. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    posthog.capture('recommendations_requested', {
      restaurant: match.chain.name,
      chain_id: match.chain.id,
    });

    return () => { cancelled = true; };
  }, [match?.chain.id]);

  if (!match) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: match.chain.name,
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
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Finding your perfect order...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.textTertiary }]}>
              {error}
            </Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                setError(null);
                getRecommendations({
                  chain: match.chain.id,
                  description: getDescriptionWithTime(),
                  maxCalories: filters.maxCalories ?? undefined,
                })
                  .then(setData)
                  .catch(() => setError('Could not load recommendations right now. Please try again.'))
                  .finally(() => setLoading(false));
              }}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: colors.brandGreen, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </Pressable>
          </View>
        ) : data && data.categories.length > 0 ? (
          <>
            {/* Tip banner */}
            {data.tip ? (
              <View style={[styles.tipBanner, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                {Platform.OS === 'ios' ? (
                  <SymbolView name={'lightbulb.fill' as any} style={{ width: 16, height: 16 }} tintColor={colors.brandGreen} />
                ) : (
                  <Text style={{ fontSize: 14 }}>💡</Text>
                )}
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  {data.tip}
                </Text>
              </View>
            ) : null}

            {/* Categories with combos */}
            {data.categories.map((category, catIdx) => (
              <View key={catIdx} style={styles.categorySection}>
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {category.name}
                </Text>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                  {category.description}
                </Text>

                {category.combos.map((combo, comboIdx) => (
                  <View key={comboIdx}>
                    <Text style={[styles.mealNumber, { color: colors.textTertiary }]}>
                      {category.combos.length === 1 ? 'MEAL' : `MEAL ${comboIdx + 1}`}
                    </Text>
                    <ComboCard
                      combo={combo}
                      colors={colors}
                      onPress={() => {
                        posthog.capture('recommendation_tapped', {
                          restaurant: match.chain.name,
                          category: category.name,
                          meals: combo.meals.map((m) => m.name).join(' + '),
                          calories: combo.totalCalories,
                        });
                        if (combo.meals.length === 1 && combo.meals[0]) {
                          // Single item — go to meal detail
                          setMeal({ ...combo.meals[0], chainId: match.chain.id }, match);
                          router.push('/(restaurants)/meal-detail');
                        } else if (combo.meals.length > 1) {
                          // Multi-item — go to combo detail
                          setCombo({
                            chain: data!.chain,
                            meals: combo.meals,
                            totalCalories: combo.totalCalories,
                            totalProtein: combo.totalProtein,
                            totalCarbs: combo.totalCarbs,
                            totalFat: combo.totalFat,
                          }, match);
                          router.push('/(restaurants)/combo-detail');
                        }
                      }}
                    />
                  </View>
                ))}
              </View>
            ))}
          </>
        ) : (
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No recommendations available for this restaurant
          </Text>
        )}
      </ScrollView>
    </>
  );
}

function ComboCard({
  combo,
  colors,
  onPress,
}: {
  combo: RecommendationCombo;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.comboCard,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {/* Food items */}
      {combo.meals.map((meal, i) => (
        <View key={meal.id} style={[
          styles.itemRow,
          i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceBorder },
        ]}>
          <MealImage uri={meal.photo} name={meal.name} style={styles.itemPhoto} />
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
              {meal.name}
            </Text>
            <Text style={[styles.itemMacros, { color: colors.textTertiary }]}>
              {meal.calories} cal · {meal.protein}p · {meal.carbs}c · {meal.fat}f
            </Text>
            <MealBadges meal={meal as any} compact />
          </View>
        </View>
      ))}

      {/* Drink */}
      {combo.drink && (
        <View style={[styles.itemRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceBorder }]}>
          <Text style={styles.drinkEmoji}>🥤</Text>
          <Text style={[styles.itemName, { color: colors.text }]}>{combo.drink}</Text>
        </View>
      )}

      {/* Totals */}
      <View style={[styles.totalsRow, { borderTopColor: colors.surfaceBorder }]}>
        <Text style={[styles.totalsMacros, { color: colors.text }]}>
          {combo.totalCalories} cal · {combo.totalProtein}p · {combo.totalCarbs}c · {combo.totalFat}f
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40 },

  // Loading
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 16 },
  loadingAnimation: { width: 80, height: 80 },
  loadingText: { fontSize: 15, fontWeight: '500' },

  // Error
  errorContainer: { alignItems: 'center', paddingTop: 60, gap: 16, paddingHorizontal: Spacing.lg },
  errorText: { fontSize: 15, textAlign: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Empty
  emptyText: { textAlign: 'center', paddingTop: 60, fontSize: 15 },

  // Tip
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },

  // Category
  categorySection: { marginBottom: 24, paddingHorizontal: Spacing.lg },
  categoryName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  categoryDescription: { fontSize: 14, fontWeight: '500', lineHeight: 20, marginBottom: 14 },

  // "MEAL 1" label above each card
  mealNumber: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },

  // Combo card (vertical)
  comboCard: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Item row (food or drink)
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  itemPhoto: { width: 56, height: 56, borderRadius: 12 },
  itemInfo: { flex: 1, gap: 3 },
  itemName: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  itemMacros: { fontSize: 12, fontWeight: '500' },

  // Drink
  drinkEmoji: { fontSize: 22, width: 56, textAlign: 'center' },

  // Totals
  totalsRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalsMacros: { fontSize: 13, fontWeight: '700' },
});
