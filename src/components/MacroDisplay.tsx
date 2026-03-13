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
        <MacroCard label="Protein" value={protein} color={colors.protein} bg={colors.proteinBg} />
        <MacroCard label="Carbs" value={carbs} color={colors.carbs} bg={colors.carbsBg} />
        <MacroCard label="Fat" value={fat} color={colors.fat} bg={colors.fatBg} />
      </View>
    );
  }

  // Small inline: clean, single-tone, not rainbow
  return (
    <Text style={[styles.smallText, { color: colors.textTertiary }]}>
      {protein}p · {carbs}c · {fat}f
    </Text>
  );
}

function MacroCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[styles.largeCard, { backgroundColor: bg }]}>
      <Text style={[Typography.macro, { color }]}>{value}g</Text>
      <Text style={[styles.largeLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  smallText: {
    ...Typography.macroSmall,
    marginTop: 4,
  },
  largeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  largeCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  largeLabel: {
    ...Typography.macroLabel,
    opacity: 0.7,
  },
});
