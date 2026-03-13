import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { NearbyMatch } from '@/api/types';
import { getNearbyRestaurants } from '@/api/client';

type LocationStatus = 'loading' | 'granted' | 'denied' | 'undetermined';

export function useNearbyChains(radiusMiles: number) {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [restaurants, setRestaurants] = useState<NearbyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status: permStatus } = await Location.getForegroundPermissionsAsync();

      if (permStatus === 'undetermined') {
        setStatus('undetermined');
        setIsLoading(false);
        return;
      }

      if (permStatus !== 'granted') {
        setStatus('denied');
        setIsLoading(false);
        return;
      }

      setStatus('granted');

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const data = await getNearbyRestaurants(
        location.coords.latitude,
        location.coords.longitude,
        radiusMiles
      );

      setRestaurants(data);
    } catch {
      setError('Could not load restaurants. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [radiusMiles]);

  const requestPermission = useCallback(async () => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    if (permStatus === 'granted') {
      setStatus('granted');
      fetchRestaurants();
    } else {
      setStatus('denied');
    }
  }, [fetchRestaurants]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return {
    status,
    restaurants,
    isLoading,
    error,
    retry: fetchRestaurants,
    requestPermission,
  };
}
