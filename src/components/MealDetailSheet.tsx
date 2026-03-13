import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActionSheetIOS,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { GlassButton } from './GlassButton';
import { Meal, NearbyMatch } from '@/api/types';

interface MealDetailSheetProps {
  meal: Meal | null;
  match: NearbyMatch | null;
  visible: boolean;
  onClose: () => void;
}

const DELIVERY_LABELS: Record<string, string> = {
  uberEats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  doordash: 'DoorDash',
};

export function MealDetailSheet({ meal, match, visible, onClose }: MealDetailSheetProps) {
  const colors = useThemeColors();

  const openDirections = useCallback(() => {
    if (!match) return;
    const { latitude, longitude } = match;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Apple Maps', 'Google Maps', 'Waze'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) Linking.openURL(`maps://?daddr=${latitude},${longitude}`);
          else if (index === 2) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
          else if (index === 3) Linking.openURL(`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`).catch(() => Linking.openURL('https://apps.apple.com/app/waze/id323229106'));
        }
      );
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
    }
  }, [match]);

  if (!meal || !match) return null;

  const deliveryLinks = Object.entries(match.chain.deliveryLinks).filter(([, url]) => url);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.closeButton, { color: colors.brandGreen }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Full-width photo — no overlay */}
          <Image source={{ uri: meal.photo }} style={styles.photo} contentFit="cover" />

          {/* Meal info */}
          <View style={styles.infoSection}>
            <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
            <Text style={[styles.restaurantInfo, { color: colors.textSecondary }]}>
              {match.chain.name} · {match.distance.toFixed(1)} mi
            </Text>
          </View>

          {/* Nutrition — clean horizontal row, no colorful cards */}
          <View style={[styles.nutritionRow, { borderColor: colors.surfaceBorder }]}>
            <NutritionItem label="Calories" value={`${meal.calories}`} color={colors.text} />
            <View style={[styles.nutritionDivider, { backgroundColor: colors.surfaceBorder }]} />
            <NutritionItem label="Protein" value={`${meal.protein}g`} color={colors.protein} />
            <View style={[styles.nutritionDivider, { backgroundColor: colors.surfaceBorder }]} />
            <NutritionItem label="Carbs" value={`${meal.carbs}g`} color={colors.carbs} />
            <View style={[styles.nutritionDivider, { backgroundColor: colors.surfaceBorder }]} />
            <NutritionItem label="Fat" value={`${meal.fat}g`} color={colors.fat} />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <GlassButton label="Get Directions" onPress={openDirections} variant="primary" />

            {deliveryLinks.length > 0 && (
              <View style={styles.deliveryRow}>
                {deliveryLinks.map(([key, url]) => (
                  <GlassButton
                    key={key}
                    label={DELIVERY_LABELS[key] || key}
                    onPress={() => Linking.openURL(url!).catch(() => {})}
                    style={styles.deliveryItem}
                  />
                ))}
              </View>
            )}

            {match.chain.websiteUrl && (
              <GlassButton
                label="Restaurant Website"
                onPress={() => Linking.openURL(match.chain.websiteUrl)}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function NutritionItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.nutritionItem}>
      <Text style={[styles.nutritionValue, { color }]}>{value}</Text>
      <Text style={[styles.nutritionLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  headerSpacer: { width: 50 },
  closeButton: { fontSize: 17, fontWeight: '600' },
  content: { paddingBottom: 40 },
  photo: {
    width: '100%',
    height: 240,
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 20,
    paddingBottom: 16,
  },
  mealName: {
    ...Typography.title,
    lineHeight: 32,
  },
  restaurantInfo: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nutritionLabel: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
  },
  nutritionDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    gap: 10,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deliveryItem: { flex: 1 },
});
