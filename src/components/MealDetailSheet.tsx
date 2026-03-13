import React, { forwardRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import MapView, { Marker } from 'react-native-maps';
import { useThemeColors, Typography } from '@/constants/theme';
import { MacroDisplay } from './MacroDisplay';
import { Meal, NearbyMatch } from '@/api/types';

interface MealDetailSheetProps {
  meal: Meal | null;
  match: NearbyMatch | null;
  onClose: () => void;
}

const DELIVERY_LABELS: Record<string, string> = {
  uberEats: 'Uber Eats',
  deliveroo: 'Deliveroo',
  doordash: 'DoorDash',
};

export const MealDetailSheet = forwardRef<BottomSheet, MealDetailSheetProps>(
  ({ meal, match, onClose }, ref) => {
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
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['85%']}
        enableDynamicSizing={false}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={{ backgroundColor: colors.background }}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
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

          <Pressable onPress={openDirections} style={styles.mapContainer}>
            <MapView
              style={styles.map}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              initialRegion={{
                latitude: match.latitude,
                longitude: match.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: match.latitude,
                  longitude: match.longitude,
                }}
                title={match.chain.name}
              />
            </MapView>
            <Text style={[styles.mapHint, { color: colors.textSecondary }]}>
              Tap to open directions
            </Text>
          </Pressable>

          {deliveryLinks.length > 0 && (
            <View style={styles.deliveryRow}>
              {deliveryLinks.map(([key, url]) => (
                <Pressable
                  key={key}
                  onPress={() => openDeliveryApp(url!)}
                  style={({ pressed }) => [
                    styles.deliveryButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.deliveryText, { color: colors.text }]}>
                    {DELIVERY_LABELS[key] || key}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {match.chain.websiteUrl && (
            <Pressable
              onPress={() => Linking.openURL(match.chain.websiteUrl)}
              style={({ pressed }) => [
                styles.websiteButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={[styles.websiteText, { color: colors.textSecondary }]}>
                Visit Restaurant Website
              </Text>
            </Pressable>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
  },
  photoContainer: {
    height: 120,
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
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
  },
  calorieNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  calorieLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
  },
  mealName: {
    ...Typography.heading,
    paddingHorizontal: 20,
    paddingTop: 14,
    lineHeight: 26,
  },
  restaurantInfo: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 20,
    marginTop: 3,
  },
  macroSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  map: {
    height: 120,
  },
  mapHint: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    paddingVertical: 6,
  },
  deliveryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  deliveryButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  websiteButton: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  websiteText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
