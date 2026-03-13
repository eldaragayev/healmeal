import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { Filters } from '@/api/types';

interface FilterSheetProps {
  visible: boolean;
  filters: Filters;
  cuisines: string[];
  onFiltersChange: (filters: Filters) => void;
  onClose: () => void;
}

export function FilterSheet({
  visible,
  filters,
  cuisines,
  onFiltersChange,
  onClose,
}: FilterSheetProps) {
  const colors = useThemeColors();

  const activeCount =
    (filters.maxCalories !== null ? 1 : 0) +
    (filters.highProtein ? 1 : 0) +
    (filters.lowCarb ? 1 : 0) +
    (filters.lowFat ? 1 : 0) +
    (filters.cuisine !== null ? 1 : 0);

  const clearAll = () => {
    onFiltersChange({ maxCalories: null, highProtein: false, lowCarb: false, lowFat: false, cuisine: null });
  };

  const update = (partial: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...partial });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          {activeCount > 0 ? (
            <Pressable onPress={clearAll} hitSlop={12}>
              <Text style={[styles.clearButton, { color: colors.textSecondary }]}>Clear all</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.doneButton, { color: colors.brandGreen }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Calorie budget */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Calories</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
              Max calories per meal
            </Text>

            <View style={styles.optionRow}>
              {[null, 300, 400, 500, 600, 800].map((cal) => {
                const active = filters.maxCalories === cal;
                return (
                  <Pressable
                    key={String(cal)}
                    onPress={() => update({ maxCalories: cal })}
                    style={[
                      styles.optionChip,
                      active
                        ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder }
                        : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.optionChipText, { color: active ? colors.brandGreen : colors.text }]}>
                      {cal === null ? 'Any' : `${cal}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* Macro toggles */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Macros</Text>

            <ToggleRow
              title="High protein"
              subtitle="30g+ protein per meal"
              value={filters.highProtein}
              onChange={(val) => update({ highProtein: val })}
              tintColor={colors.brandGreen}
              colors={colors}
            />

            <View style={[styles.toggleDivider, { backgroundColor: colors.surfaceBorder }]} />

            <ToggleRow
              title="Low carb"
              subtitle="Under 30g carbs per meal"
              value={filters.lowCarb}
              onChange={(val) => update({ lowCarb: val })}
              tintColor={colors.brandGreen}
              colors={colors}
            />

            <View style={[styles.toggleDivider, { backgroundColor: colors.surfaceBorder }]} />

            <ToggleRow
              title="Low fat"
              subtitle="Under 15g fat per meal"
              value={filters.lowFat}
              onChange={(val) => update({ lowFat: val })}
              tintColor={colors.brandGreen}
              colors={colors}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* Cuisine */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuisine</Text>

            <View style={styles.cuisineGrid}>
              <CuisineChip
                label="All"
                active={filters.cuisine === null}
                onPress={() => update({ cuisine: null })}
                colors={colors}
              />
              {cuisines.map((cuisine) => (
                <CuisineChip
                  key={cuisine}
                  label={cuisine}
                  active={filters.cuisine === cuisine}
                  onPress={() => update({ cuisine: filters.cuisine === cuisine ? null : cuisine })}
                  colors={colors}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ToggleRow({ title, subtitle, value, onChange, tintColor, colors }: {
  title: string; subtitle: string; value: boolean;
  onChange: (val: boolean) => void; tintColor: string; colors: any;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.toggleTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.toggleSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: tintColor }} />
    </View>
  );
}

function CuisineChip({ label, active, onPress, colors }: {
  label: string; active: boolean; onPress: () => void; colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.cuisineChip,
        active
          ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder }
          : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <Text style={[styles.cuisineChipText, { color: active ? colors.brandGreen : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  headerTitle: { ...Typography.heading },
  headerSpacer: { width: 60 },
  clearButton: { fontSize: 16, fontWeight: '500' },
  doneButton: { fontSize: 17, fontWeight: '600' },
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
  optionChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  cuisineChipText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
