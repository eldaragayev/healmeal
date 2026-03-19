import { requireNativeModule } from 'expo-modules-core';

export interface NearbyPlace {
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  url?: string;
}

export interface SearchCompletion {
  title: string;
  subtitle: string;
}

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  name: string;
  city?: string;
  country?: string;
}

interface MapkitSearchModuleType {
  searchNearby(
    latitude: number,
    longitude: number,
    radiusMiles: number,
    query: string,
  ): Promise<NearbyPlace[]>;
  searchNearbyAll(
    latitude: number,
    longitude: number,
    radiusMiles: number,
  ): Promise<NearbyPlace[]>;
  completeSearch(
    query: string,
    latitude: number,
    longitude: number,
  ): Promise<SearchCompletion[]>;
  geocodeCompletion(
    title: string,
    subtitle: string,
  ): Promise<GeocodedLocation | null>;
}

export default requireNativeModule<MapkitSearchModuleType>('MapkitSearch');
