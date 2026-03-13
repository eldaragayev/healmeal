import { ScrollView, Text, Pressable, StyleSheet, Platform, View } from 'react-native';
import { useThemeColors } from '@/constants/theme';
import { Filters } from '@/api/types';

let GlassView: any = View;
if (Platform.OS === 'ios') {
  try {
    GlassView = require('expo-glass-effect').GlassView;
  } catch {}
}

interface FilterChipsProps {
  filters: Filters;
  cuisines: string[];
  onToggleCalories: (max: number | null) => void;
  onToggleProtein: () => void;
  onToggleCuisine: (cuisine: string | null) => void;
}

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function Chip({ label, active, onPress }: ChipProps) {
  const colors = useThemeColors();
  const useGlass = Platform.OS === 'ios' && GlassView !== View && !active;

  if (useGlass) {
    return (
      <Pressable onPress={onPress}>
        <GlassView
          style={styles.glassChip}
          glassEffectStyle="regular"
        >
          <Text style={[styles.chipText, { color: colors.chipInactiveText }]}>
            {label}
          </Text>
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? {
              backgroundColor: colors.chipActive,
              borderColor: colors.chipActiveBorder,
              borderWidth: 1.5,
            }
          : {
              backgroundColor: colors.chipInactive,
              borderColor: colors.chipInactiveBorder,
              borderWidth: 1,
            },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.brandGreen : colors.chipInactiveText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const CALORIE_OPTIONS = [400, 500, 600];

export function FilterChips({
  filters,
  cuisines,
  onToggleCalories,
  onToggleProtein,
  onToggleCuisine,
}: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CALORIE_OPTIONS.map((cal) => (
        <Chip
          key={`cal-${cal}`}
          label={`Under ${cal} cal`}
          active={filters.maxCalories === cal}
          onPress={() =>
            onToggleCalories(filters.maxCalories === cal ? null : cal)
          }
        />
      ))}
      <Chip
        label="High Protein"
        active={filters.highProtein}
        onPress={onToggleProtein}
      />
      {cuisines.map((cuisine) => (
        <Chip
          key={cuisine}
          label={cuisine}
          active={filters.cuisine === cuisine}
          onPress={() =>
            onToggleCuisine(filters.cuisine === cuisine ? null : cuisine)
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassChip: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
