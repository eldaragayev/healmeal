import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors } from '@/constants/theme';
import { MealCard } from './MealCard';
import { Meal, NearbyMatch, Filters } from '@/api/types';
import { filterMeals } from '@/utils/filters';

let GlassView: any = View;
if (Platform.OS === 'ios') {
  try {
    GlassView = require('expo-glass-effect').GlassView;
  } catch {}
}

interface RestaurantCardProps {
  match: NearbyMatch;
  filters: Filters;
  onMealPress: (meal: Meal, match: NearbyMatch) => void;
}

export function RestaurantCard({ match, filters, onMealPress }: RestaurantCardProps) {
  const colors = useThemeColors();
  const filteredMeals = filterMeals(match.chain.meals, filters);

  if (filteredMeals.length === 0) return null;

  const useGlass = Platform.OS === 'ios' && GlassView !== View;
  const CardContainer = useGlass ? GlassView : View;
  const cardProps = useGlass
    ? { style: [styles.card, { borderRadius: 20 }], glassEffectStyle: 'regular' as const }
    : {
        style: [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
            borderWidth: 1,
          },
        ],
      };

  return (
    <CardContainer {...cardProps}>
      <View style={styles.header}>
        <Image source={{ uri: match.chain.logo }} style={styles.logo} contentFit="cover" />
        <View style={styles.headerText}>
          <Text style={[styles.name, { color: colors.text }]}>
            {match.chain.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
            {match.distance.toFixed(1)} mi · {match.chain.cuisine}
          </Text>
        </View>
      </View>

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
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  mealScroll: {
    gap: 10,
    paddingBottom: 4,
  },
});
