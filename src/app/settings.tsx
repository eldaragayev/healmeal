import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useThemeColors, Spacing, Typography } from '@/constants/theme';
import { useSettings } from '@/hooks/useSettings';
import { WeightHistory } from '@/components/WeightHistory';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { settings, isLoaded, updateSettings, addWeightEntry, removeWeightEntry } =
    useSettings();
  const [showWeightHistory, setShowWeightHistory] = useState(false);

  if (!isLoaded) return null;

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[Typography.largeTitle, styles.title, { color: colors.text }]}>
          Settings
        </Text>

        {/* Weight Management */}
        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          WEIGHT
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
        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          LOCATION
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Search Radius</Text>
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

        {/* About */}
        <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
          ABOUT
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Version</Text>
            <Text style={[styles.value, { color: colors.textTertiary }]}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>

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
  screen: { flex: 1 },
  content: { paddingBottom: 40 },
  title: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.lg,
    marginBottom: 8,
    marginTop: 20,
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
  label: { fontSize: 16, fontWeight: '500' },
  value: { fontSize: 16, fontWeight: '600' },
  slider: { marginTop: 8, marginBottom: 4 },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
