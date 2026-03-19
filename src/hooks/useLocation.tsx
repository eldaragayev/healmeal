import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  areaName: string | null;
  countryCode: string | null;
  isLoading: boolean;
  isManual: boolean;
}

interface LocationContextValue extends LocationState {
  setManualLocation: (coords: { latitude: number; longitude: number }, label?: string | null) => void;
  resetToCurrentLocation: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; countryCode: string | null }> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results.length > 0) {
      const p = results[0];
      const specific = p.name || p.street;
      const area = p.district || p.subregion;
      const city = p.city;
      const countryCode = p.isoCountryCode ?? null;

      let name = 'Unknown Location';
      if (area && city && area !== city) name = `${area}, ${city}`;
      else if (area) name = area;
      else if (specific && city && specific !== city) name = `${specific}, ${city}`;
      else if (city) name = city;
      else if (p.region) name = p.region;

      return { name, countryCode };
    }
  } catch {}
  return { name: 'Unknown Location', countryCode: null };
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocationState>({
    coords: null,
    areaName: null,
    countryCode: null,
    isLoading: true,
    isManual: false,
  });
  const requestIdRef = useRef(0);

  const updateFromCoords = useCallback(async (
    lat: number,
    lng: number,
    manual: boolean,
    requestId: number,
    manualLabel?: string | null,
  ) => {
    const { name, countryCode } = await reverseGeocode(lat, lng);
    if (requestId !== requestIdRef.current) return;
    setState({
      coords: { latitude: lat, longitude: lng },
      areaName: manualLabel?.trim() || name,
      countryCode,
      isLoading: false,
      isManual: manual,
    });
  }, []);

  const detectCurrentLocation = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (requestId !== requestIdRef.current) return;
      if (status !== 'granted') {
        setState({ coords: null, areaName: null, countryCode: null, isLoading: false, isManual: false });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (requestId !== requestIdRef.current) return;
      await updateFromCoords(loc.coords.latitude, loc.coords.longitude, false, requestId);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setState({ coords: null, areaName: null, countryCode: null, isLoading: false, isManual: false });
    }
  }, [updateFromCoords]);

  useEffect(() => {
    detectCurrentLocation();
  }, [detectCurrentLocation]);

  const setManualLocation = useCallback(
    async (coords: { latitude: number; longitude: number }, label?: string | null) => {
      const requestId = ++requestIdRef.current;
      setState((s) => ({ ...s, isLoading: true }));
      await updateFromCoords(coords.latitude, coords.longitude, true, requestId, label);
    },
    [updateFromCoords]
  );

  return (
    <LocationContext.Provider
      value={{
        ...state,
        setManualLocation,
        resetToCurrentLocation: detectCurrentLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
