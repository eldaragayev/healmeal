import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors } from '@/constants/theme';
import { MacroDisplay } from './MacroDisplay';
import { Meal } from '@/api/types';

interface MealCardProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}

export function MealCard({ meal, onPress }: MealCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={() => onPress(meal)}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.photo }} style={styles.image} contentFit="cover" />
        <View style={styles.calorieBadge}>
          <Text style={styles.calorieText}>{meal.calories}</Text>
          <Text style={styles.calorieUnit}>cal</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {meal.name}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        <MacroDisplay protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 156,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 96,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  calorieBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  calorieText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  calorieUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
  },
  info: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 6,
  },
});
