import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useThemeColors } from '@/constants/theme';
import { useLocation } from '@/hooks/useLocation';
import { posthog } from '@/analytics';

const hasGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

export default function LocationPickerModal() {
  const colors = useThemeColors();
  const router = useRouter();
  const { coords, isManual, setManualLocation, resetToCurrentLocation } = useLocation();
  const mapRef = useRef<MapView>(null);
  const searchRequestIdRef = useRef(0);
  const suppressAutocompleteRef = useRef(false);

  const [pin, setPin] = useState(
    coords ?? { latitude: 51.5074, longitude: -0.1278 }
  );
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectionMethod, setSelectionMethod] = useState<'initial' | 'search' | 'map'>('initial');

  // Autocomplete suggestions via MapKit MKLocalSearchCompleter
  let MapkitSearch: any = null;
  try { MapkitSearch = require('modules/mapkit-search').MapkitSearch; } catch {}

  interface Suggestion {
    title: string;
    subtitle: string;
  }
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (suppressAutocompleteRef.current) {
      suppressAutocompleteRef.current = false;
      setSuggestions([]);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2 || !MapkitSearch) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const requestId = ++searchRequestIdRef.current;
      try {
        const results = await MapkitSearch.completeSearch(trimmed, pin.latitude, pin.longitude);
        if (requestId === searchRequestIdRef.current) {
          setSuggestions(results.slice(0, 6));
        }
      } catch {
        // Autocomplete failed silently — user can still search manually
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectSuggestion = useCallback(async (s: Suggestion) => {
    searchRequestIdRef.current += 1;
    suppressAutocompleteRef.current = true;
    setQuery(s.title + (s.subtitle ? ', ' + s.subtitle : ''));
    setSuggestions([]);
    setSearchError(null);
    Keyboard.dismiss();
    try {
      const result = MapkitSearch ? await MapkitSearch.geocodeCompletion(s.title, s.subtitle) : null;
      if (result) {
        setPin({ latitude: result.latitude, longitude: result.longitude });
        setSelectionMethod('search');
        mapRef.current?.animateToRegion(
          { latitude: result.latitude, longitude: result.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
          400,
        );
      }
    } catch {}
  }, [pin]);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const requestId = ++searchRequestIdRef.current;
    Keyboard.dismiss();
    setSearching(true);
    setSearchError(null);
    setSuggestions([]);

    try {
      const results = await Location.geocodeAsync(trimmed);
      if (requestId !== searchRequestIdRef.current) return;
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setPin({ latitude, longitude });
        setSelectionMethod('search');
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          400
        );
      } else {
        setSearchError('No results found');
      }
    } catch {
      if (requestId !== searchRequestIdRef.current) return;
      setSearchError('Search failed');
    } finally {
      if (requestId !== searchRequestIdRef.current) return;
      setSearching(false);
    }
  }, [query]);

  const handleMapPress = useCallback((e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    searchRequestIdRef.current += 1;
    setSearching(false);
    setPin(e.nativeEvent.coordinate);
    setSearchError(null);
    setSelectionMethod('map');
  }, []);

  const handleConfirm = useCallback(() => {
    posthog.capture('location_changed', {
      method: 'manual_pin',
      selection_method: selectionMethod,
      had_search_query: Boolean(query.trim()),
      from_manual_location: isManual,
    });
    const manualLabel = selectionMethod === 'search' && query.trim() ? query.trim() : undefined;
    setManualLocation(pin, manualLabel);
    router.back();
  }, [pin, query, selectionMethod, isManual, setManualLocation, router]);

  const handleUseCurrent = useCallback(() => {
    posthog.capture('location_changed', {
      method: 'current_location',
      from_manual_location: isManual,
    });
    resetToCurrentLocation();
    router.back();
  }, [isManual, resetToCurrentLocation, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search address or city..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={colors.brandGreen} style={styles.searchSpinner} />}
        </View>
      </View>

      {searchError && !suggestions.length && (
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{searchError}</Text>
      )}

      {/* Map + overlaid suggestions */}
      <View style={styles.mapWrapper}>
        {/* Autocomplete dropdown — overlays map */}
        {suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            {suggestions.map((s, i) => (
              <Pressable
                key={`${s.title}-${s.subtitle}-${i}`}
                onPress={() => selectSuggestion(s)}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceBorder },
                  { opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.suggestionTitle, { color: colors.text }]} numberOfLines={1}>{s.title}</Text>
                {s.subtitle ? <Text style={[styles.suggestionSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>{s.subtitle}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}
        <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: pin.latitude,
            longitude: pin.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          <Marker coordinate={pin} />
        </MapView>
        </View>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomRow}>
        <ActionButton
          label="Set Location"
          onPress={handleConfirm}
          colors={colors}
          variant="primary"
        />
        <ActionButton
          label="Use My Location"
          onPress={handleUseCurrent}
          colors={colors}
          variant="secondary"
        />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  colors,
  variant,
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  variant: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  if (hasGlass) {
    return (
      <Pressable onPress={onPress} style={styles.actionBtn}>
        <GlassView style={styles.actionBtnInner} glassEffectStyle="regular" isInteractive>
          <Text style={[styles.actionLabel, { color: isPrimary ? colors.brandGreen : colors.text }]}>
            {label}
          </Text>
        </GlassView>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        styles.actionBtnInner,
        isPrimary
          ? { backgroundColor: colors.brandGreenSoft, borderColor: colors.brandGreenBorder, borderWidth: 1 }
          : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, borderWidth: 1 },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[styles.actionLabel, { color: isPrimary ? colors.brandGreen : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  mapWrapper: {
    flex: 1,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 1,
  },
  errorText: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  bottomRow: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 34,
  },
  actionBtn: {},
  actionBtnInner: {
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
