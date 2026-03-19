import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors, Spacing } from '@/constants/theme';
import { MealCard } from './MealCard';
import { Meal, NearbyMatch, Filters } from '@/api/types';
import { useChainMeals } from '@/hooks/useChainMeals';

interface RestaurantCardProps {
  match: NearbyMatch;
  filters: Filters;
  onMealPress: (meal: Meal, match: NearbyMatch) => void;
  onRestaurantPress: (match: NearbyMatch) => void;
}

export const RestaurantCard = React.memo(function RestaurantCard({ match, filters, onMealPress, onRestaurantPress }: RestaurantCardProps) {
  const colors = useThemeColors();
  const [logoFailed, setLogoFailed] = useState(false);
  // Meals are fetched with sort + macro filters applied server-side
  const { meals, isLoading, isRefetching } = useChainMeals(match.chain.id, filters, 10);

  return (
    <View style={styles.section}>
      {/* Tappable restaurant header */}
      <Pressable
        onPress={() => onRestaurantPress(match)}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.6 : 1 }]}
      >
        {logoFailed ? (
          <View style={[styles.logoFallback, { backgroundColor: colors.brandGreen }]}>
            <Text style={styles.logoLetter}>{match.chain.name[0]}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: match.chain.logo }}
            style={[styles.logo, { backgroundColor: colors.accent }]}
            contentFit="cover"
            onError={() => setLogoFailed(true)}
          />
        )}
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]} accessibilityLabel={match.chain.name}>
            {match.chain.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            {match.distance > 0 ? `${match.distance.toFixed(1)} mi · ` : ''}{match.chain.cuisine}
            {match.chain.approximate ? ' · Based on US menu' : ''}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
      </Pressable>

      {/* Meal carousel */}
      {meals.length === 0 && isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.textTertiary} />
        </View>
      ) : meals.length === 0 ? null : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mealScroll}
          >
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onPress={(m) => onMealPress(m, match)}
              />
            ))}
          </ScrollView>
          {isRefetching && (
            <ActivityIndicator size="small" color={colors.textTertiary} style={styles.refetchSpinner} />
          )}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Spacing.lg,
    marginBottom: 16,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
  },
  chevron: {
    fontSize: 26,
    fontWeight: '300',
  },
  mealScroll: {
    gap: 14,
    paddingHorizontal: Spacing.lg,
  },
  loadingRow: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refetchSpinner: {
    position: 'absolute',
    bottom: 8,
    right: 20,
  },
});
