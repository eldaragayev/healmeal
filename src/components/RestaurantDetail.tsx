import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Linking,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useThemeColors, Typography, Spacing } from '@/constants/theme';
import { MacroDisplay } from './MacroDisplay';
import { GlassButton } from './GlassButton';
import { NearbyMatch, Meal } from '@/api/types';

interface RestaurantDetailProps {
  match: NearbyMatch | null;
  visible: boolean;
  onClose: () => void;
  onMealPress: (meal: Meal, match: NearbyMatch) => void;
}

const DELIVERY_LABELS: Record<string, string> = {
  uberEats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  doordash: 'DoorDash',
};

export function RestaurantDetail({ match, visible, onClose, onMealPress }: RestaurantDetailProps) {
  const colors = useThemeColors();

  if (!match) return null;

  const deliveryLinks = Object.entries(match.chain.deliveryLinks).filter(([, url]) => url);

  const openDirections = () => {
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
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.closeButton, { color: colors.brandGreen }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.restaurantHeader}>
            <Text style={[styles.restaurantName, { color: colors.text }]}>
              {match.chain.name}
            </Text>
            <Text style={[styles.restaurantMeta, { color: colors.textSecondary }]}>
              {match.distance.toFixed(1)} mi · {match.chain.cuisine} · {match.address}
            </Text>
          </View>

          <GlassButton
            label="Get Directions"
            onPress={openDirections}
            variant="primary"
            style={styles.actionButton}
          />

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

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Menu ({match.chain.meals.length} meals)
          </Text>

          {match.chain.meals.map((meal) => (
            <Pressable
              key={meal.id}
              onPress={() => onMealPress(meal, match)}
              style={({ pressed }) => [
                styles.mealRow,
                { borderBottomColor: colors.surfaceBorder, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Image source={{ uri: meal.photo }} style={styles.mealImage} contentFit="cover" />
              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                <View style={styles.mealMeta}>
                  <Text style={[styles.mealCalories, { color: colors.brandGreen }]}>
                    {meal.calories} cal
                  </Text>
                  <MacroDisplay protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
                </View>
              </View>
              <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
            </Pressable>
          ))}

          {match.chain.websiteUrl && (
            <GlassButton
              label="Visit Restaurant Website"
              onPress={() => Linking.openURL(match.chain.websiteUrl)}
              style={styles.websiteButton}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 12 },
  headerSpacer: { width: 50 },
  closeButton: { fontSize: 17, fontWeight: '600' },
  content: { paddingBottom: 40 },
  restaurantHeader: { paddingHorizontal: Spacing.lg, marginBottom: 16 },
  restaurantName: { ...Typography.title, lineHeight: 38 },
  restaurantMeta: { fontSize: 14, fontWeight: '500', marginTop: 4 },
  actionButton: { marginHorizontal: Spacing.lg, marginBottom: 12 },
  deliveryRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: 24 },
  deliveryItem: { flex: 1 },
  sectionTitle: { ...Typography.heading, paddingHorizontal: Spacing.lg, marginBottom: 8 },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  mealImage: { width: 60, height: 60, borderRadius: 10 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  mealMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealCalories: { fontSize: 13, fontWeight: '700' },
  chevron: { fontSize: 20, fontWeight: '300' },
  websiteButton: { marginHorizontal: Spacing.lg, marginTop: 20 },
});
