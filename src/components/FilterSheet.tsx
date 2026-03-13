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
import Slider from '@react-native-community/slider';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { Filters } from '@/api/types';

interface FilterSheetProps {
  visible: boolean;
  filters: Filters;
  cuisines: string[];
  calorieTarget: number;
  onFiltersChange: (filters: Filters) => void;
  onCalorieTargetChange: (value: number) => void;
  onClose: () => void;
}

export function FilterSheet({
  visible,
  filters,
  cuisines,
  calorieTarget,
  onFiltersChange,
  onCalorieTargetChange,
  onClose,
}: FilterSheetProps) {
  const colors = useThemeColors();

  const activeCount =
    (filters.maxCalories !== null ? 1 : 0) +
    (filters.highProtein ? 1 : 0) +
    (filters.cuisine !== null ? 1 : 0);

  const clearAll = () => {
    onFiltersChange({ maxCalories: null, highProtein: false, cuisine: null });
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

        <ScrollView contentContainerStyle={styles.content}>
          {/* Calorie budget */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Calorie budget</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
              Show meals under this calorie count
            </Text>

            <View style={styles.calorieOptions}>
              {[null, 400, 500, 600, 800].map((cal) => {
                const active = filters.maxCalories === cal;
                return (
                  <Pressable
                    key={String(cal)}
                    onPress={() => onFiltersChange({ ...filters, maxCalories: cal })}
                    style={[
                      styles.calorieChip,
                      active
                        ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder }
                        : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.calorieChipText, { color: active ? colors.brandGreen : colors.text }]}>
                      {cal === null ? 'Any' : `< ${cal}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* High protein */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>High protein</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
                  Only show meals with 30g+ protein
                </Text>
              </View>
              <Switch
                value={filters.highProtein}
                onValueChange={(val) => onFiltersChange({ ...filters, highProtein: val })}
                trackColor={{ true: colors.brandGreen }}
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* Cuisine */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cuisine</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
              Filter by restaurant type
            </Text>

            <View style={styles.cuisineGrid}>
              <Pressable
                onPress={() => onFiltersChange({ ...filters, cuisine: null })}
                style={[
                  styles.cuisineChip,
                  filters.cuisine === null
                    ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder }
                    : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <Text style={[styles.cuisineChipText, { color: filters.cuisine === null ? colors.brandGreen : colors.text }]}>
                  All
                </Text>
              </Pressable>
              {cuisines.map((cuisine) => {
                const active = filters.cuisine === cuisine;
                return (
                  <Pressable
                    key={cuisine}
                    onPress={() => onFiltersChange({ ...filters, cuisine: active ? null : cuisine })}
                    style={[
                      styles.cuisineChip,
                      active
                        ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder }
                        : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                    ]}
                  >
                    <Text style={[styles.cuisineChipText, { color: active ? colors.brandGreen : colors.text }]}>
                      {cuisine}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          {/* Daily calorie target (from settings) */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily calorie target</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>
              Your personal daily goal: {calorieTarget} cal
            </Text>
            <Slider
              minimumValue={200}
              maximumValue={1200}
              step={50}
              value={calorieTarget}
              onSlidingComplete={(val: number) => onCalorieTargetChange(val)}
              minimumTrackTintColor={colors.brandGreen}
              style={styles.slider}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  headerTitle: {
    ...Typography.heading,
  },
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
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 4,
    marginBottom: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
  },
  calorieOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  calorieChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  calorieChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  slider: {
    marginTop: 4,
  },
});
