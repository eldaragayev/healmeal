import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, Typography } from '@/constants/theme';

interface MacroDisplayProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: 'small' | 'large';
}

export function MacroDisplay({ protein, carbs, fat, size = 'small' }: MacroDisplayProps) {
  const colors = useThemeColors();

  if (size === 'large') {
    return (
      <View style={styles.largeContainer}>
        <View style={[styles.largeCard, { backgroundColor: colors.proteinBg }]}>
          <Text style={[styles.largeLabel, { color: colors.textSecondary }]}>PROTEIN</Text>
          <Text style={[styles.largeValue, { color: colors.protein }]}>{protein}g</Text>
        </View>
        <View style={[styles.largeCard, { backgroundColor: colors.carbsBg }]}>
          <Text style={[styles.largeLabel, { color: colors.textSecondary }]}>CARBS</Text>
          <Text style={[styles.largeValue, { color: colors.carbs }]}>{carbs}g</Text>
        </View>
        <View style={[styles.largeCard, { backgroundColor: colors.fatBg }]}>
          <Text style={[styles.largeLabel, { color: colors.textSecondary }]}>FAT</Text>
          <Text style={[styles.largeValue, { color: colors.fat }]}>{fat}g</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.smallContainer}>
      <Text style={[styles.smallText, { color: colors.protein }]}>P {protein}g</Text>
      <Text style={[styles.smallText, { color: colors.carbs }]}>C {carbs}g</Text>
      <Text style={[styles.smallText, { color: colors.fat }]}>F {fat}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  smallText: {
    fontSize: 8,
    fontWeight: '700',
  },
  largeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  largeCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  largeLabel: {
    ...Typography.macroLabel,
  },
  largeValue: {
    ...Typography.macro,
    marginTop: 2,
  },
});
