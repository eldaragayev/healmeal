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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useThemeColors();

  if (hasGlass) {
    return (
      <Pressable onPress={onPress}>
        <GlassView
          style={styles.chip}
          glassEffectStyle="regular"
          isInteractive
        >
          <Text style={[styles.chipText, { color: active ? colors.brandGreen : colors.text }]}>
            {active ? '✓ ' : ''}{label}
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
          ? { backgroundColor: colors.chipActive, borderColor: colors.chipActiveBorder, borderWidth: 1 }
          : { backgroundColor: colors.chipInactive, borderColor: colors.chipInactiveBorder, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.brandGreen : colors.chipInactiveText }]}>
        {active ? '✓ ' : ''}{label}
      </Text>
    </Pressable>
  );
}

const CALORIE_OPTIONS = [400, 500, 600];

export function FilterChips({
  filters, cuisines, onToggleCalories, onToggleProtein, onToggleCuisine,
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
          label={`< ${cal}`}
          active={filters.maxCalories === cal}
          onPress={() => onToggleCalories(filters.maxCalories === cal ? null : cal)}
        />
      ))}
      <Chip
        label="Protein"
        active={filters.highProtein}
        onPress={onToggleProtein}
      />
      {cuisines.map((cuisine) => (
        <Chip
          key={cuisine}
          label={cuisine}
          active={filters.cuisine === cuisine}
          onPress={() => onToggleCuisine(filters.cuisine === cuisine ? null : cuisine)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    overflow: 'visible',
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});
