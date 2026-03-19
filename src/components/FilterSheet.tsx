import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import Slider from '@react-native-community/slider';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { GlassButton } from './GlassButton';
import { Filters, MealSort } from '@/api/types';
import { posthog } from '@/analytics';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

interface FilterSheetProps {
  filters: Filters;
  cuisines: string[];
  distanceRadius: number;
  onFiltersChange: (filters: Filters) => void;
  onDistanceChange: (value: number) => void;
  onClose: () => void;
}

export function FilterSheetContent({
  filters,
  cuisines,
  distanceRadius,
  onFiltersChange,
  onDistanceChange,
  onClose,
}: FilterSheetProps) {
  const colors = useThemeColors();

  const activeCount =
    (filters.maxCalories !== null ? 1 : 0) +
    (filters.minProtein !== null ? 1 : 0) +
    (filters.maxCarbs !== null ? 1 : 0) +
    (filters.maxFat !== null ? 1 : 0) +
    (filters.cuisine !== null ? 1 : 0);

  const handleDone = () => {
    if (activeCount > 0) {
      posthog.capture('filter_applied', {
        max_calories: filters.maxCalories,
        min_protein: filters.minProtein,
        max_carbs: filters.maxCarbs,
        max_fat: filters.maxFat,
        cuisine: filters.cuisine,
        distance: distanceRadius,
        active_count: activeCount,
        $set_once: { first_filter_applied_at: new Date().toISOString() },
      });
    }
    onClose();
  };

  const clearAll = () => {
    posthog.capture('filter_cleared');
    onFiltersChange({ maxCalories: null, minProtein: null, maxCarbs: null, maxFat: null, cuisine: null, sort: 'protein' });
  };

  const update = (partial: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header} collapsable={false}>
        {activeCount > 0 ? (
          <GlassButton label="Clear all" onPress={clearAll} size="compact" />
        ) : (
          <View style={styles.headerSpacer} />
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
        <GlassButton label="Done" onPress={handleDone} size="compact" variant="primary" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      {/* Sort */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sort meals by</Text>
          <View style={styles.optionRow}>
            {([
              ['protein', 'Protein ↑'],
              ['calories', 'Calories ↓'],
              ['fat', 'Fat ↓'],
              ['carbs', 'Carbs ↓'],
              ['name', 'Name'],
            ] as [MealSort, string][]).map(([value, label]) => (
              <GlassChip
                key={value}
                label={label}
                active={filters.sort === value}
                onPress={() => update({ sort: value })}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

      {/* Calorie budget */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Calories</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
            Max calories per meal
          </Text>

          <View style={styles.optionRow}>
            {[null, 300, 400, 500, 600, 800].map((cal) => (
              <GlassChip
                key={String(cal)}
                label={cal === null ? 'Any' : `${cal}`}
                active={filters.maxCalories === cal}
                onPress={() => update({ maxCalories: cal })}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        {/* Macro sliders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Macros</Text>

          <MacroSlider
            label="Protein"
            sublabel="min"
            value={filters.minProtein}
            min={0}
            max={80}
            step={5}
            suffix="g+"
            onCommit={(val) => update({ minProtein: val === 0 ? null : val })}
            tintColor={colors.protein}
            colors={colors}
          />

          <MacroSlider
            label="Carbs"
            sublabel="max"
            value={filters.maxCarbs}
            min={0}
            max={100}
            step={5}
            suffix="g"
            onCommit={(val) => update({ maxCarbs: val === 100 ? null : val })}
            tintColor={colors.carbs}
            colors={colors}
          />

          <MacroSlider
            label="Fat"
            sublabel="max"
            value={filters.maxFat}
            min={0}
            max={60}
            step={5}
            suffix="g"
            onCommit={(val) => update({ maxFat: val === 60 ? null : val })}
            tintColor={colors.fat}
            colors={colors}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        {/* Cuisine */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuisine</Text>

          <View style={styles.cuisineGrid}>
            <GlassChip
              label="All"
              active={filters.cuisine === null}
              onPress={() => update({ cuisine: null })}
              colors={colors}
            />
            {cuisines.map((cuisine) => (
              <GlassChip
                key={cuisine}
                label={cuisine}
                active={filters.cuisine === cuisine}
                onPress={() => update({ cuisine: filters.cuisine === cuisine ? null : cuisine })}
                colors={colors}
              />
            ))}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        {/* Distance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Distance</Text>
          <DistanceSlider
            value={distanceRadius}
            onCommit={onDistanceChange}
            tintColor={colors.brandGreen}
            colors={colors}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function MacroSlider({ label, sublabel, value, min, max, step, suffix, onCommit, tintColor, colors }: {
  label: string; sublabel: string; value: number | null;
  min: number; max: number; step: number; suffix: string;
  onCommit: (val: number) => void; tintColor: string; colors: any;
}) {
  const defaultValue = sublabel === 'min' ? min : max;
  const [localValue, setLocalValue] = useState(value ?? defaultValue);
  const [isDragging, setIsDragging] = useState(false);

  const displayValue = isDragging ? localValue : (value ?? defaultValue);
  const isAny = !isDragging && value === null;

  return (
    <View style={styles.macroSliderRow}>
      <View style={styles.macroLabelRow}>
        <Text style={[styles.macroLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: isAny ? colors.textTertiary : tintColor }]}>
          {isAny ? 'Any' : `${sublabel} ${displayValue}${suffix}`}
        </Text>
      </View>
      <Slider
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={displayValue}
        onValueChange={(val: number) => {
          setIsDragging(true);
          setLocalValue(val);
        }}
        onSlidingComplete={(val: number) => {
          setIsDragging(false);
          onCommit(val);
        }}
        minimumTrackTintColor={tintColor}
      />
    </View>
  );
}

function DistanceSlider({ value, onCommit, tintColor, colors }: {
  value: number; onCommit: (val: number) => void; tintColor: string; colors: any;
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  const displayValue = isDragging ? localValue : value;

  return (
    <>
      <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
        Within {displayValue} miles
      </Text>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={0.5}
        value={displayValue}
        onValueChange={(val: number) => {
          setIsDragging(true);
          setLocalValue(val);
        }}
        onSlidingComplete={(val: number) => {
          setIsDragging(false);
          onCommit(val);
        }}
        minimumTrackTintColor={tintColor}
      />
    </>
  );
}

function GlassChip({ label, active, onPress, colors }: {
  label: string; active: boolean; onPress: () => void; colors: any;
}) {
  if (hasGlass) {
    return (
      <Pressable onPress={onPress}>
        <GlassView style={styles.glassChip} glassEffectStyle="regular" isInteractive>
          <Text style={[styles.glassChipText, { color: active ? colors.brandGreen : colors.text }]}>
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
        styles.glassChip,
        active
          ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder, borderWidth: 1 }
          : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
      ]}
    >
      <Text style={[styles.glassChipText, { color: active ? colors.brandGreen : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 24,
    paddingBottom: 14,
  },
  headerTitle: { ...Typography.heading },
  headerSpacer: { width: 60 },
  content: { paddingBottom: 40 },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: -8,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  glassChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  macroSliderRow: {
    marginBottom: 20,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
