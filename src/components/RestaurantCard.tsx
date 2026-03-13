import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors } from '@/constants/theme';
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
  const filteredMeals = filterMeals(match.chain.meals, filters);

  if (filteredMeals.length === 0) return null;

  return (
    <View style={styles.card}>
      {/* Tappable restaurant header */}
      <Pressable
        onPress={() => onRestaurantPress(match)}
        style={({ pressed }) => [
          styles.header,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Image source={{ uri: match.chain.logo }} style={styles.logo} contentFit="cover" />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>
            {match.chain.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            {match.distance.toFixed(1)} mi · {match.chain.cuisine}
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

      {/* Separator */}
      <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
  mealScroll: {
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
    marginBottom: 12,
  },
});
