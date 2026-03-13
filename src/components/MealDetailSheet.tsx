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
import { useThemeColors, Typography } from '@/constants/theme';
import { MacroDisplay } from './MacroDisplay';
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
        {
          options: ['Cancel', 'Apple Maps', 'Google Maps', 'Waze'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) {
            Linking.openURL(`maps://?daddr=${latitude},${longitude}`);
          } else if (index === 2) {
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
            );
          } else if (index === 3) {
            Linking.openURL(
              `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
            ).catch(() => {
              Linking.openURL('https://apps.apple.com/app/waze/id323229106');
            });
          }
        }
      );
    } else {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      );
    }
  }, [match]);

  const openDeliveryApp = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  if (!meal || !match) return null;

  const deliveryLinks = Object.entries(match.chain.deliveryLinks).filter(
    ([, url]) => url
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with close button */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerSpacer} />
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.closeButton, { color: colors.brandGreen }]}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.photoContainer}>
            <Image source={{ uri: meal.photo }} style={styles.photo} contentFit="cover" />
            <View style={styles.calorieBadge}>
              <Text style={styles.calorieNumber}>{meal.calories}</Text>
              <Text style={styles.calorieLabel}>calories</Text>
            </View>
          </View>

          <Text style={[styles.mealName, { color: colors.text }]}>
            {meal.name}
          </Text>
          <Text style={[styles.restaurantInfo, { color: colors.textSecondary }]}>
            {match.chain.name} · {match.distance.toFixed(1)} mi away
          </Text>

          <View style={styles.macroSection}>
            <MacroDisplay
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              size="large"
            />
          </View>

          <GlassButton
            label="📍 Get Directions"
            onPress={openDirections}
            tint={colors.brandGreen}
            textColor="#fff"
            style={styles.actionButton}
          />

          {deliveryLinks.length > 0 && (
            <View style={styles.deliveryRow}>
              {deliveryLinks.map(([key, url]) => (
                <GlassButton
                  key={key}
                  label={DELIVERY_LABELS[key] || key}
                  onPress={() => openDeliveryApp(url!)}
                  style={styles.deliveryItem}
                />
              ))}
            </View>
          )}

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
  container: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSpacer: {
    width: 50,
  },
  closeButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingBottom: 40,
  },
  photoContainer: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  calorieBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  calorieNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  calorieLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  mealName: {
    ...Typography.heading,
    fontSize: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
    lineHeight: 30,
  },
  restaurantInfo: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  macroSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionButton: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  deliveryItem: {
    flex: 1,
  },
  websiteButton: {
    marginHorizontal: 20,
    marginTop: 4,
  },
});
