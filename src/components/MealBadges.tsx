import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/constants/theme';
import { Meal } from '@/api/types';

interface Badge {
  label: string;
  colorKey: 'protein' | 'carbs' | 'fat' | 'brandGreen';
  bgKey: 'proteinBg' | 'carbsBg' | 'fatBg' | 'brandGreenSoft';
}

export function getMealBadges(meal: Meal): Badge[] {
  const badges: Badge[] = [];
  if (meal.protein >= 30) badges.push({ label: 'High Protein', colorKey: 'protein', bgKey: 'proteinBg' });
  if (meal.carbs < 30) badges.push({ label: 'Low Carb', colorKey: 'carbs', bgKey: 'carbsBg' });
  if (meal.fat < 15) badges.push({ label: 'Low Fat', colorKey: 'fat', bgKey: 'fatBg' });
  if (meal.calories <= 400) badges.push({ label: 'Low Cal', colorKey: 'brandGreen', bgKey: 'brandGreenSoft' });
  return badges;
}

export const MealBadges = React.memo(function MealBadges({ meal, compact }: { meal: Meal; compact?: boolean }) {
  const colors = useThemeColors();
  const badges = getMealBadges(meal);

  if (badges.length === 0) return null;

  return (
    <View style={styles.row}>
      {badges.map((b) => (
        <View
          key={b.label}
          style={[
            compact ? styles.badgeCompact : styles.badge,
            { backgroundColor: colors[b.bgKey] },
          ]}
        >
          <Text
            style={[
              compact ? styles.badgeLabelCompact : styles.badgeLabel,
              { color: colors[b.colorKey] },
            ]}
          >
            {b.label}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  badgeLabelCompact: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
