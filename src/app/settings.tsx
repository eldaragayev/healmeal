import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useThemeColors, Spacing, Typography } from '@/constants/theme';
import { useSettings } from '@/hooks/useSettings';
import { WeightHistory } from '@/components/WeightHistory';

const ALL_CUISINES = ['Chicken', 'Italian', 'Japanese', 'Mediterranean', 'Mexican'];

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { settings, isLoaded, updateSettings, addWeightEntry, removeWeightEntry } =
    useSettings();
  const [showWeightHistory, setShowWeightHistory] = useState(false);

  if (!isLoaded) return null;

  const toggleCuisine = (cuisine: string) => {
    const current = settings.cuisinePreferences;
    const next = current.includes(cuisine)
      ? current.filter((c) => c !== cuisine)
      : [...current, cuisine];
    updateSettings({ cuisinePreferences: next });
  };

  const editGoalWeight = () => {
    Alert.prompt(
      'Goal Weight',
      'Enter your goal weight in kg',
      (text) => {
        const num = parseFloat(text);
        if (!isNaN(num) && num > 0) {
          updateSettings({ goalWeight: num });
        }
      },
      'plain-text',
      settings.goalWeight > 0 ? String(settings.goalWeight) : '',
      'decimal-pad'
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[Typography.title, styles.title, { color: colors.text }]}>
          Settings
        </Text>

        {/* Dietary Preferences */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          DIETARY PREFERENCES
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Calorie Target</Text>
            <Text style={[styles.value, { color: colors.brandGreen }]}>
              {settings.calorieTarget} cal
            </Text>
          </View>
          <Slider
            minimumValue={200}
            maximumValue={1000}
            step={50}
            value={settings.calorieTarget}
            onSlidingComplete={(val: number) => updateSettings({ calorieTarget: val })}
            minimumTrackTintColor={colors.brandGreen}
            style={styles.slider}
          />

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>High Protein Only</Text>
            <Switch
              value={settings.highProtein}
              onValueChange={(val) => updateSettings({ highProtein: val })}
              trackColor={{ true: colors.brandGreen }}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Text style={[styles.label, { color: colors.text, marginBottom: 8 }]}>
            Cuisine Preferences
          </Text>
          <View style={styles.cuisineGrid}>
            {ALL_CUISINES.map((cuisine) => {
              const selected = settings.cuisinePreferences.includes(cuisine);
              return (
                <Pressable
                  key={cuisine}
                  onPress={() => toggleCuisine(cuisine)}
                  style={[
                    styles.cuisineChip,
                    {
                      backgroundColor: selected ? colors.chipActive : colors.chipInactive,
                      borderColor: selected ? colors.chipActiveBorder : colors.chipInactiveBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cuisineChipText,
                      { color: selected ? colors.brandGreen : colors.chipInactiveText },
                    ]}
                  >
                    {cuisine}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            {settings.cuisinePreferences.length === 0
              ? 'No preference — showing all cuisines'
              : `Showing ${settings.cuisinePreferences.length} selected`}
          </Text>
        </View>

        {/* Weight Management */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          WEIGHT MANAGEMENT
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Pressable style={styles.row} onPress={() => setShowWeightHistory(true)}>
            <Text style={[styles.label, { color: colors.text }]}>Current Weight</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {settings.currentWeight > 0 ? `${settings.currentWeight} kg` : 'Not set'} ›
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <Pressable style={styles.row} onPress={editGoalWeight}>
            <Text style={[styles.label, { color: colors.text }]}>Goal Weight</Text>
            <Text style={[styles.value, { color: colors.textSecondary }]}>
              {settings.goalWeight > 0 ? `${settings.goalWeight} kg` : 'Tap to set'} ›
            </Text>
          </Pressable>
        </View>

        {/* Location */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          LOCATION
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Distance Radius</Text>
            <Text style={[styles.value, { color: colors.brandGreen }]}>
              {settings.distanceRadius} mi
            </Text>
          </View>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={0.5}
            value={settings.distanceRadius}
            onSlidingComplete={(val: number) => updateSettings({ distanceRadius: val })}
            minimumTrackTintColor={colors.brandGreen}
            style={styles.slider}
          />
        </View>
      </ScrollView>

      {/* Weight History Modal */}
      <Modal visible={showWeightHistory} animationType="slide">
        <WeightHistory
          history={settings.weightHistory}
          onAdd={addWeightEntry}
          onRemove={removeWeightEntry}
          onClose={() => setShowWeightHistory(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  slider: {
    marginTop: 8,
    marginBottom: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  cuisineChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
  },
});
