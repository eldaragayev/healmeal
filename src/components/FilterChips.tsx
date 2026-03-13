import { ScrollView, Text, Pressable, StyleSheet, Platform, View } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeColors } from '@/constants/theme';
import { Filters } from '@/api/types';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

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

  if (hasGlass) {
    return (
      <Pressable onPress={onPress}>
        <GlassView
          style={styles.chip}
          glassEffectStyle={active ? 'regular' : 'clear'}
          tintColor={active ? colors.brandGreen : undefined}
          isInteractive
        >
          <Text
            style={[
              styles.chipText,
              { color: active ? colors.brandGreen : colors.text },
            ]}
          >
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
      style={styles.scroll}
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
  scroll: {
    overflow: 'visible',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 6,
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
