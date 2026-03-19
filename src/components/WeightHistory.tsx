import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { CartesianChart, Area, Line } from 'victory-native';
import { matchFont } from '@shopify/react-native-skia';
import { useThemeColors, Spacing } from '@/constants/theme';

const chartFont = matchFont({ fontFamily: 'Helvetica', fontSize: 11 });
import { GlassButton } from './GlassButton';
import { WeightEntry } from '@/api/types';
import { posthog } from '@/analytics';

interface WeightHistoryProps {
  history: WeightEntry[];
  onAdd: (entry: WeightEntry) => void;
  onRemove: (date: string) => void;
  onClose: () => void;
}

export function WeightHistory({ history, onAdd, onRemove, onClose }: WeightHistoryProps) {
  const colors = useThemeColors();

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const chronological = [...sortedHistory].reverse();
  const latest = sortedHistory[0];

  const [value, setValue] = useState(() => latest ? latest.weight.toFixed(1) : '75.0');
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current && latest) {
      setValue(latest.weight.toFixed(1));
      initialized.current = true;
    }
  }, [latest]);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const numericValue = parseFloat(value) || 0;

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.round((numericValue + delta) * 10) / 10);
    setValue(next.toFixed(1));
  };

  const handleLog = () => {
    if (numericValue <= 0) return;
    posthog.capture('weight_logged', {
      weight_kg: numericValue,
      entry_count: history.length + 1,
      $set: { current_weight_kg: numericValue },
      $set_once: { first_weight_logged_at: new Date().toISOString() },
    });
    onAdd({ date: new Date().toISOString().split('T')[0], weight: numericValue });
  };

  const handleRemove = (date: string) => {
    Alert.alert('Remove entry?', `Delete weight for ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onRemove(date) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header} collapsable={false}>
        <Text style={[styles.title, { color: colors.text }]}>Weight</Text>
        <GlassButton label="Log Weight" onPress={handleLog} size="compact" variant="primary" />
      </View>

      <FlatList
        data={sortedHistory}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        ListHeaderComponent={
          <>
            {/* Large number + stepper */}
            <View style={styles.entrySection}>
              <View style={styles.numberRow}>
                <Pressable
                  onPress={() => adjust(-0.1)}
                  style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.stepperText, { color: colors.text }]}>−</Text>
                </Pressable>

                <Pressable onPress={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 50); }}>
                  {editing ? (
                    <TextInput
                      ref={inputRef}
                      style={[styles.bigNumber, { color: colors.text }]}
                      value={value}
                      onChangeText={setValue}
                      keyboardType="decimal-pad"
                      onBlur={() => setEditing(false)}
                      selectTextOnFocus
                    />
                  ) : (
                    <Text style={[styles.bigNumber, { color: colors.text }]}>
                      {numericValue.toFixed(1)}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => adjust(0.1)}
                  style={[styles.stepperBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.stepperText, { color: colors.text }]}>+</Text>
                </Pressable>
              </View>

              <Text style={[styles.unitLabel, { color: colors.textTertiary }]}>kg</Text>
            </View>

            {/* Chart */}
            {chronological.length >= 2 && (
              <View style={styles.chartContainer}>
                <WeightChart data={chronological} color={colors.brandGreen} />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleRemove(item.date)}
            style={[styles.entry, { borderBottomColor: colors.surfaceBorder }]}
          >
            <Text style={[styles.entryDate, { color: colors.textSecondary }]}>{item.date}</Text>
            <Text style={[styles.entryWeight, { color: colors.text }]}>{item.weight} kg</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            No entries yet.
          </Text>
        }
      />
    </View>
  );
}

function WeightChart({ data, color }: { data: WeightEntry[]; color: string }) {
  const colors = useThemeColors();
  const chartData = data.map((entry, i) => ({ x: i, weight: entry.weight, label: entry.date.slice(5) }));
  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const padding = Math.max((max - min) * 0.3, 0.5);

  return (
    <View style={{ height: 160 }}>
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['weight']}
        domain={{ y: [min - padding, max + padding] }}
        axisOptions={{
          font: chartFont,
          tickCount: { x: Math.min(data.length, 5), y: 4 },
          labelColor: colors.textTertiary,
          formatYLabel: (val) => `${val.toFixed(1)}`,
          formatXLabel: (val) => {
            const idx = Math.round(val);
            return chartData[idx]?.label ?? '';
          },
        }}
      >
        {({ points, chartBounds }) => (
          <>
            <Area
              points={points.weight}
              y0={chartBounds.bottom}
              color={color}
              opacity={0.15}
              curveType="natural"
              animate={{ type: 'timing', duration: 500 }}
            />
            <Line
              points={points.weight}
              color={color}
              strokeWidth={2.5}
              curveType="natural"
              animate={{ type: 'timing', duration: 500 }}
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 28,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  entrySection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 28,
  },
  bigNumber: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -3,
    minWidth: 140,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  chartContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: 24,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryDate: { fontSize: 15 },
  entryWeight: { fontSize: 15, fontWeight: '600' },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});
