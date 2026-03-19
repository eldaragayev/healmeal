import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { NearbyMatch } from '@/api/types';
import { getNearbyRestaurants, NearbyRestaurantsError } from '@/api/client';
import { useLocation } from '@/hooks/useLocation';
import { posthog } from '@/analytics';

type LocationStatus = 'loading' | 'granted' | 'denied' | 'undetermined';

interface NearbyState {
  status: LocationStatus;
  restaurants: NearbyMatch[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  requestPermission: () => void;
}

const NearbyContext = createContext<NearbyState | null>(null);

export function NearbyProvider({
  radiusMiles,
  children,
}: {
  radiusMiles: number;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [restaurants, setRestaurants] = useState<NearbyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    coords,
    countryCode,
    isManual,
    isLoading: isLocationLoading,
    resetToCurrentLocation,
  } = useLocation();

  // Cache key — only refetch if location actually changed meaningfully
  const lastFetchKey = useRef<string>('');
  const requestIdRef = useRef(0);

  const fetchRestaurants = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (!isManual) {
      const { status: permStatus } = await Location.getForegroundPermissionsAsync();
      if (requestId !== requestIdRef.current) return;
      if (permStatus === 'undetermined') {
        setStatus('undetermined');
        setRestaurants([]);
        setIsLoading(false);
        return;
      }
      if (permStatus !== 'granted') {
        setStatus('denied');
        setRestaurants([]);
        setIsLoading(false);
        return;
      }
    }

    setStatus('granted');
    if (!coords) {
      if (!isLocationLoading) {
        setRestaurants([]);
        setIsLoading(false);
        setError('Could not determine your location. Try again.');
      }
      return;
    }

    // Skip if same location (rounded to ~100m precision)
    const key = `${coords.latitude.toFixed(3)}_${coords.longitude.toFixed(3)}_${radiusMiles}_${countryCode}`;
    if (key === lastFetchKey.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setRestaurants([]);
    const startedAt = Date.now();

    try {
      const data = await getNearbyRestaurants(
        coords.latitude,
        coords.longitude,
        radiusMiles,
        countryCode,
      );
      if (requestId !== requestIdRef.current) return;
      setRestaurants(data.matches);
      lastFetchKey.current = key;
      posthog.capture('restaurant_list_loaded', {
        chains_count: data.matches.length,
        matched_chain_count: data.matchedChainCount,
        place_count: data.placeCount,
        unique_place_count: data.uniquePlaceCount,
        radius_miles: radiusMiles,
        country_code: countryCode,
        discovery_source: data.discoverySource,
        duration_ms: Date.now() - startedAt,
        is_manual_location: isManual,
      });
    } catch (e: any) {
      if (requestId !== requestIdRef.current) return;
      console.error('[HealMeal] fetchRestaurants error:', e);
      posthog.capture('restaurant_list_load_failed', {
        radius_miles: radiusMiles,
        country_code: countryCode,
        discovery_source: e instanceof NearbyRestaurantsError ? e.discoverySource : 'unknown',
        failure_stage: e instanceof NearbyRestaurantsError ? e.stage : 'unknown',
        duration_ms: Date.now() - startedAt,
        error_message: e?.message || 'Unknown error',
        is_manual_location: isManual,
      });
      setRestaurants([]);
      setError('Could not load restaurants right now. Please try again.');
    } finally {
      if (requestId !== requestIdRef.current) return;
      setIsLoading(false);
    }
  }, [radiusMiles, coords, countryCode, isManual, isLocationLoading]);

  const requestPermission = useCallback(async () => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    posthog.capture('location_permission_result', { status: permStatus });
    if (permStatus === 'granted') {
      setStatus('granted');
      resetToCurrentLocation();
    } else {
      setStatus('denied');
    }
  }, [resetToCurrentLocation]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return React.createElement(
    NearbyContext.Provider,
    {
      value: { status, restaurants, isLoading, error, retry: fetchRestaurants, requestPermission },
    },
    children,
  );
}

export function useNearbyChains(_radiusMiles?: number) {
  const ctx = useContext(NearbyContext);
  if (!ctx) throw new Error('useNearbyChains must be used within NearbyProvider');
  return ctx;
}
