import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useThemeColors, Spacing } from '@/constants/theme';
import { MealCard } from './MealCard';
import { Meal, NearbyMatch, Filters } from '@/api/types';
import { filterMeals } from '@/utils/filters';

interface RestaurantCardProps {
  match: NearbyMatch;
  filters: Filters;
  onMealPress: (meal: Meal, match: NearbyMatch) => void;
  onRestaurantPress: (match: NearbyMatch) => void;
}

export function RestaurantCard({ match, filters, onMealPress, onRestaurantPress }: RestaurantCardProps) {
  const colors = useThemeColors();
  const [logoFailed, setLogoFailed] = useState(false);
  const filteredMeals = filterMeals(match.chain.meals, filters);

  if (filteredMeals.length === 0) return null;

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
          <Text style={[styles.name, { color: colors.text }]}>
            {match.chain.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            {match.distance.toFixed(1)} mi away · {match.chain.cuisine}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
      </Pressable>

      {/* Meal carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mealScroll}
      >
        {filteredMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onPress={(m) => onMealPress(m, match)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.lg,
    marginBottom: 14,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 1,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  mealScroll: {
    gap: 14,
    paddingHorizontal: Spacing.lg,
  },
});
