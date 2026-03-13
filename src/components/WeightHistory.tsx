import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Spacing } from '@/constants/theme';
import { WeightEntry } from '@/api/types';

interface WeightHistoryProps {
  history: WeightEntry[];
  onAdd: (entry: WeightEntry) => void;
  onRemove: (date: string) => void;
  onClose: () => void;
}

export function WeightHistory({ history, onAdd, onRemove, onClose }: WeightHistoryProps) {
  const colors = useThemeColors();
  const [weight, setWeight] = useState('');

  const handleAdd = () => {
    const num = parseFloat(weight);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid weight', 'Please enter a valid number.');
      return;
    }
    onAdd({ date: new Date().toISOString().split('T')[0], weight: num });
    setWeight('');
  };

  const handleRemove = (date: string) => {
    Alert.alert('Remove entry?', `Delete weight for ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onRemove(date) },
    ]);
  };

  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Weight History</Text>
        <Pressable onPress={onClose}>
          <Text style={[styles.closeButton, { color: colors.brandGreen }]}>Done</Text>
        </Pressable>
      </View>

      {/* Trend visualization */}
      {sortedHistory.length >= 2 && (
        <View style={styles.chartContainer}>
          <SimpleWeightChart data={sortedHistory} color={colors.brandGreen} textColor={colors.textTertiary} />
        </View>
      )}

      {/* Add entry */}
      <View style={styles.addRow}>
        <TextInput
          style={[
            styles.input,
            { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
          ]}
          placeholder="Weight (kg)"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <Pressable
          onPress={handleAdd}
          style={[styles.addButton, { backgroundColor: colors.brandGreen }]}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      {/* History list (newest first for display) */}
      <FlatList
        data={[...sortedHistory].reverse()}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => handleRemove(item.date)}
            style={[styles.entry, { borderBottomColor: colors.surfaceBorder }]}
          >
            <Text style={[styles.entryDate, { color: colors.textSecondary }]}>
              {item.date}
            </Text>
            <Text style={[styles.entryWeight, { color: colors.text }]}>
              {item.weight} kg
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textTertiary }]}>
            No entries yet. Add your first weight above.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

// Simple SVG-free chart using View bars
function SimpleWeightChart({
  data,
  color,
  textColor,
}: {
  data: WeightEntry[];
  color: string;
  textColor: string;
}) {
  const screenWidth = Dimensions.get('window').width - 40;
  const chartHeight = 120;
  const weights = data.map((d) => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  return (
    <View>
      <View style={[styles.chartArea, { height: chartHeight }]}>
        {data.map((entry, i) => {
          const normalized = (entry.weight - min) / range;
          const barHeight = Math.max(4, normalized * (chartHeight - 20));
          const left = (i / (data.length - 1)) * (screenWidth - 20);
          return (
            <View
              key={`${entry.date}-${i}`}
              style={{
                position: 'absolute',
                bottom: 0,
                left,
                width: 6,
                height: barHeight,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          );
        })}
      </View>
      <View style={styles.chartLabels}>
        <Text style={[styles.chartLabel, { color: textColor }]}>{min.toFixed(1)} kg</Text>
        <Text style={[styles.chartLabel, { color: textColor }]}>{max.toFixed(1)} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartArea: {
    position: 'relative',
    marginBottom: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 10,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  addButton: {
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryDate: {
    fontSize: 14,
  },
  entryWeight: {
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
