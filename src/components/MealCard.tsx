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
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: meal.photo }} style={styles.image} contentFit="cover" />
        <View style={styles.calorieBadge}>
          <Text style={styles.calorieText}>{meal.calories} cal</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {meal.name}
        </Text>
        <MacroDisplay protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 80,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  calorieBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  calorieText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    padding: 8,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
});
