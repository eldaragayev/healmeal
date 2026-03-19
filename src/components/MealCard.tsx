import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MealImage } from './MealImage';
import { useThemeColors } from '@/constants/theme';
import { Meal } from '@/api/types';
import { MealBadges } from './MealBadges';
import { HealthScoreMini } from './HealthScoreBar';
import { computeHealthScore } from '@/utils/healthScore';
import { useProfile } from '@/hooks/useProfile';

interface MealCardProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}

export const MealCard = React.memo(function MealCard({ meal, onPress }: MealCardProps) {
  const colors = useThemeColors();
  const { profile } = useProfile();
  const score = useMemo(
    () => computeHealthScore(meal, profile.goal).score,
    [meal.calories, meal.protein, meal.carbs, meal.fat, profile.goal],
  );

  return (
    <Pressable
      onPress={() => onPress(meal)}
      style={({ pressed }) => [
        styles.container,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <MealImage uri={meal.photo} name={meal.name} style={styles.image} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1} accessibilityLabel={meal.name}>
          {meal.name}
        </Text>
        <HealthScoreMini score={score} colors={colors} />
        <Text style={[styles.meta, { color: colors.textTertiary }]}>
          {meal.calories} cal · {meal.protein}p · {meal.carbs}c · {meal.fat}f
        </Text>
        <MealBadges meal={meal} compact />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 200,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 14,
  },
  info: {
    paddingTop: 8,
    paddingBottom: 2,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 13,
    fontWeight: '500',
  },
});
