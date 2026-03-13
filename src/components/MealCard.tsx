import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColors } from '@/constants/theme';
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
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <Image source={{ uri: meal.photo }} style={styles.image} contentFit="cover" />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {meal.name}
        </Text>
        <Text style={[styles.meta, { color: colors.textTertiary }]}>
          {meal.calories} cal · {meal.protein}p · {meal.carbs}c · {meal.fat}f
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 170,
  },
  image: {
    width: '100%',
    height: 114,
    borderRadius: 14,
  },
  info: {
    paddingTop: 8,
    paddingBottom: 2,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
    fontWeight: '500',
  },
});
