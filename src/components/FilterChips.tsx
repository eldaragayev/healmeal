import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/constants/theme';
import { Filters } from '@/api/types';

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

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.chipActive : colors.chipInactive,
          borderColor: active ? colors.chipActiveBorder : colors.chipInactiveBorder,
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
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
