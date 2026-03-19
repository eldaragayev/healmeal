import { posthog } from '@/analytics';
import { Chain, Meal, MealCategory, NearbyMatch } from './types';

let MapkitSearch: any = null;
try { MapkitSearch = require('modules/mapkit-search').MapkitSearch; } catch {}
let Purchases: any = null;
try { Purchases = require('react-native-purchases').default; } catch {}

interface NearbyPlace {
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  address?: string;
  city?: string;
}

export type NearbyDiscoverySource = 'overpass' | 'mapkit' | 'merged' | 'none';

export interface NearbyRestaurantsResult {
  matches: NearbyMatch[];
  discoverySource: NearbyDiscoverySource;
  placeCount: number;
  uniquePlaceCount: number;
  matchedChainCount: number;
}

export class NearbyRestaurantsError extends Error {
  constructor(
    message: string,
    public readonly discoverySource: NearbyDiscoverySource,
    public readonly stage: 'match',
  ) {
    super(message);
    this.name = 'NearbyRestaurantsError';
  }
}

const BASE_URL = 'https://healmeal-api.politesky-13f5ab28.uksouth.azurecontainerapps.io';
const API_TIMEOUT = 30000;
const MATCH_MAX_NAMES = 200;
const MATCH_NAME_MAX_CHARS = 120;
const POSTHOG_DISTINCT_ID_HEADER = 'X-PostHog-Distinct-Id';
const POSTHOG_SESSION_ID_HEADER = 'X-PostHog-Session-Id';
const REVENUECAT_APP_USER_ID_HEADER = 'X-RevenueCat-App-User-Id';
const REVENUECAT_APP_USER_ID_MAX_CHARS = 200;
const REVENUECAT_APP_USER_ID_CACHE_TTL = 5 * 60 * 1000;

let cachedRevenueCatAppUserId: string | null = null;
let cachedRevenueCatAppUserIdAt = 0;
let revenueCatAppUserIdPromise: Promise<string | null> | null = null;

function normalizeRevenueCatAppUserId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, REVENUECAT_APP_USER_ID_MAX_CHARS);
}

async function getRevenueCatAppUserId(): Promise<string | null> {
  if (cachedRevenueCatAppUserIdAt && Date.now() - cachedRevenueCatAppUserIdAt < REVENUECAT_APP_USER_ID_CACHE_TTL) {
    return cachedRevenueCatAppUserId;
  }

  if (revenueCatAppUserIdPromise) {
    return revenueCatAppUserIdPromise;
  }

  if (!Purchases?.getCustomerInfo) {
    cachedRevenueCatAppUserId = null;
    cachedRevenueCatAppUserIdAt = Date.now();
    return null;
  }

  revenueCatAppUserIdPromise = Purchases.getCustomerInfo()
    .then((info: any) => normalizeRevenueCatAppUserId(info?.originalAppUserId))
    .catch(() => null)
    .then((value: string | null) => {
      cachedRevenueCatAppUserId = value;
      cachedRevenueCatAppUserIdAt = Date.now();
      return value;
    })
    .finally(() => {
      revenueCatAppUserIdPromise = null;
    });

  return revenueCatAppUserIdPromise;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);
  const headers = new Headers(options.headers);

  const [distinctId, posthogSessionId, revenueCatAppUserId] = await Promise.all([
    Promise.resolve().then(() => posthog.getDistinctId()).catch(() => null),
    Promise.resolve().then(() => {
      const maybeGetSessionId = (posthog as any)?.getSessionId;
      if (typeof maybeGetSessionId !== 'function') return null;
      const value = maybeGetSessionId.call(posthog);
      return typeof value === 'string' && value.trim() ? value.trim() : null;
    }).catch(() => null),
    getRevenueCatAppUserId().catch(() => null),
  ]);

  if (distinctId) {
    headers.set(POSTHOG_DISTINCT_ID_HEADER, distinctId);
  }
  if (posthogSessionId) {
    headers.set(POSTHOG_SESSION_ID_HEADER, posthogSessionId);
  }
  if (revenueCatAppUserId) {
    headers.set(REVENUECAT_APP_USER_ID_HEADER, revenueCatAppUserId);
  }

  return fetch(url, { ...options, headers, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function formatApiDetail(detail: unknown): string | null {
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === 'string' && first.trim()) {
      return first.trim();
    }
    if (first && typeof first === 'object') {
      const message = typeof (first as any).msg === 'string' ? (first as any).msg.trim() : '';
      const loc = Array.isArray((first as any).loc)
        ? (first as any).loc.filter((part: unknown) => typeof part === 'string' || typeof part === 'number').join('.')
        : '';
      if (message && loc) return `${loc}: ${message}`;
      if (message) return message;
    }
  }

  return null;
}

async function getApiError(res: Response, fallback: string): Promise<Error> {
  try {
    const text = await res.text();
    if (text.trim()) {
      try {
        const data = JSON.parse(text);
        const detailMessage = formatApiDetail(data?.detail);
        if (detailMessage) return new Error(detailMessage);
      } catch {}
      return new Error(text.trim());
    }
  } catch {}

  return new Error(fallback);
}

function sanitizeNearbyPlaceName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, MATCH_NAME_MAX_CHARS);
}
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OVERPASS_TIMEOUT = 10000;

// ─── Overpass (OpenStreetMap) — primary discovery ──────────────────────────────

interface OverpassPlace {
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  address?: string;
  city?: string;
}

async function searchOverpass(lat: number, lng: number, radiusMiles: number): Promise<OverpassPlace[]> {
  const radiusMeters = Math.round(radiusMiles * 1609.344);
  const query = `[out:json][timeout:10];(node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});node["amenity"="fast_food"](around:${radiusMeters},${lat},${lng});node["amenity"="cafe"](around:${radiusMeters},${lat},${lng}););out body;`;

  for (const url of OVERPASS_URLS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const data = await res.json();

      const places: OverpassPlace[] = [];
      const R = 6371000; // earth radius meters
      const toRad = (d: number) => d * Math.PI / 180;

      for (const el of data.elements ?? []) {
        const brand = el.tags?.brand?.trim();
        const name = el.tags?.name?.trim();
        const pName = brand || name;
        if (!pName || !el.lat || !el.lon) continue;

        // Haversine distance
        const dLat = toRad(el.lat - lat);
        const dLon = toRad(el.lon - lng);
        const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat)) * Math.cos(toRad(el.lat)) * Math.sin(dLon/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) / 1609.344;

        places.push({
          name: pName,
          latitude: el.lat,
          longitude: el.lon,
          distance: Math.round(dist * 10) / 10,
        });

        // Also add the other tag if different
        if (brand && name && brand !== name) {
          places.push({ name, latitude: el.lat, longitude: el.lon, distance: Math.round(dist * 10) / 10 });
        }
      }

      return places;
    } catch (e: any) {
      clearTimeout(timer);
      // Mirror failed, try next
    }
  }

  return [] as OverpassPlace[];
}

// ─── MapKit — fallback discovery ───────────────────────────────────────────────

async function searchMapKit(lat: number, lng: number, radiusMiles: number): Promise<NearbyPlace[]> {
  if (!MapkitSearch) return [];
  try {
    return await MapkitSearch.searchNearbyAll(lat, lng, radiusMiles);
  } catch {
    return [];
  }
}

// ─── Match nearby places to chains ─────────────────────────────────────────────

interface MatchResponse {
  chains: {
    id: string;
    name: string;
    matchedInput: string;
    country: string;
    cuisine: string;
    logo: string;
    website: string;
    mealCount: number;
    approximate: boolean;
  }[];
  unmatched: string[];
}

export async function getNearbyRestaurants(
  lat: number,
  lng: number,
  radiusMiles: number,
  countryCode: string | null,
): Promise<NearbyRestaurantsResult> {
  // 1. Fetch from both Overpass and MapKit, merge results
  const [overpassPlaces, mapkitPlaces] = await Promise.all([
    searchOverpass(lat, lng, radiusMiles),
    MapkitSearch ? searchMapKit(lat, lng, radiusMiles) : Promise.resolve([] as NearbyPlace[]),
  ]);

  // Merge: start with Overpass, add MapKit places not already present (by name, case-insensitive)
  const seenLower = new Set(overpassPlaces.map((p) => p.name.toLowerCase()));
  const uniqueMapKit = mapkitPlaces.filter((p) => !seenLower.has(p.name.toLowerCase()));
  const places = [...overpassPlaces, ...uniqueMapKit].sort((a, b) => a.distance - b.distance);
  const discoverySource: NearbyDiscoverySource = places.length === 0
    ? 'none'
    : overpassPlaces.length > 0 && uniqueMapKit.length > 0
      ? 'merged'
      : overpassPlaces.length > 0
        ? 'overpass'
        : 'mapkit';

  if (places.length === 0) {
    return {
      matches: [],
      discoverySource,
      placeCount: 0,
      uniquePlaceCount: 0,
      matchedChainCount: 0,
    };
  }

  const uniqueNames: string[] = [];
  const seenSanitizedNames = new Set<string>();
  for (const place of places) {
    const sanitizedName = sanitizeNearbyPlaceName(place.name);
    if (!sanitizedName) continue;
    const key = sanitizedName.toLowerCase();
    if (seenSanitizedNames.has(key)) continue;
    seenSanitizedNames.add(key);
    uniqueNames.push(sanitizedName);
    if (uniqueNames.length >= MATCH_MAX_NAMES) break;
  }

  const names = uniqueNames;

  // 2. Match against our backend
  const body: { names: string[]; country?: string } = { names };
  if (countryCode) body.country = countryCode;

  let data: MatchResponse;
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/restaurants/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw await getApiError(res, `Match API error: ${res.status}`);
    }
    data = await res.json();
  } catch (error: any) {
    throw new NearbyRestaurantsError(
      error?.message || 'Match API error',
      discoverySource,
      'match',
    );
  }

  // 3. Build NearbyMatch objects — deduplicate by chain name (prefer non-approximate)
  const matches: NearbyMatch[] = [];
  const seenNames = new Set<string>();

  const sortedChains = [...data.chains].sort((a, b) => (a.approximate ? 1 : 0) - (b.approximate ? 1 : 0));

  for (const chain of sortedChains) {
    const nameLower = chain.name.toLowerCase();
    if (seenNames.has(nameLower)) continue;
    seenNames.add(nameLower);

    // Find location by matchedInput name from our places (Overpass or MapKit)
    const matchingPlaces = places.filter(
      (p: NearbyPlace) => sanitizeNearbyPlaceName(p.name) === chain.matchedInput
    );

    const closest = matchingPlaces.length > 0
      ? matchingPlaces.reduce((a: NearbyPlace, b: NearbyPlace) => a.distance < b.distance ? a : b)
      : null;

    const encodedName = encodeURIComponent(chain.name);

    matches.push({
      chain: {
        id: chain.id,
        name: chain.name,
        logo: chain.logo,
        cuisine: chain.cuisine,
        country: chain.country,
        approximate: chain.approximate,
        website: chain.website,
        mealCount: chain.mealCount,
        deliveryLinks: {
          uberEats: `https://www.ubereats.com/search?q=${encodedName}`,
          deliveroo: `https://deliveroo.co.uk/search?q=${encodedName}`,
          doordash: `https://www.doordash.com/search/store/${encodedName}`,
        },
        meals: [],
      },
      distance: closest?.distance ?? 0,
      latitude: closest?.latitude ?? lat,
      longitude: closest?.longitude ?? lng,
      address: closest?.address || closest?.city || '',
    });
  }

  const sortedMatches = matches.sort((a, b) => a.distance - b.distance);
  return {
    matches: sortedMatches,
    discoverySource,
    placeCount: places.length,
    uniquePlaceCount: names.length,
    matchedChainCount: data.chains.length,
  };
}

// ─── Fetch meals for a chain ───────────────────────────────────────────────────

interface MealsResponse {
  meals: {
    id: number;
    name: string;
    category: string;
    photo: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  total: number;
  hasMore: boolean;
}

// Deduplicate in-flight requests: if an identical request is already pending,
// return the same promise instead of firing a duplicate network call.
const inFlightMeals = new Map<string, Promise<{ meals: Meal[]; total: number; hasMore: boolean }>>();

export async function getChainMeals(
  chainSlug: string,
  options: {
    sort?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    category?: string;
    maxCalories?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxFat?: number;
  } = {},
): Promise<{ meals: Meal[]; total: number; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (options.sort) params.set('sort', options.sort);
  if (options.order) params.set('order', options.order);
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.offset != null) params.set('offset', String(options.offset));
  if (options.category) params.set('category', options.category);
  if (options.maxCalories != null) params.set('max_calories', String(options.maxCalories));
  if (options.minProtein != null) params.set('min_protein', String(options.minProtein));
  if (options.maxCarbs != null) params.set('max_carbs', String(options.maxCarbs));
  if (options.maxFat != null) params.set('max_fat', String(options.maxFat));

  const cacheKey = `${chainSlug}?${params}`;
  const existing = inFlightMeals.get(cacheKey);
  if (existing) return existing;

  const promise = fetchWithTimeout(`${BASE_URL}/chains/${chainSlug}/meals?${params}`)
    .then(async (res) => {
      if (!res.ok) throw await getApiError(res, `Meals API error: ${res.status}`);
      const data: MealsResponse = await res.json();
      return {
        meals: data.meals.map((m) => ({
          ...m,
          chainId: chainSlug,
        })),
        total: data.total,
        hasMore: data.hasMore,
      };
    })
    .finally(() => {
      inFlightMeals.delete(cacheKey);
    });

  inFlightMeals.set(cacheKey, promise);
  return promise;
}

// ─── Search meals across chains ─────────────────────────────────────────────────

export interface SearchMeal {
  id: number;
  name: string;
  category: string;
  photo: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  chainId: string;
  chainName: string;
  chainLogo: string;
}

export async function searchMeals(options: {
  q?: string;
  chains: string[];
  sort?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  maxCalories?: number;
  minProtein?: number;
  maxCarbs?: number;
  maxFat?: number;
}): Promise<{ meals: SearchMeal[]; total: number; hasMore: boolean }> {
  const body: Record<string, any> = { chains: options.chains };
  if (options.q) body.q = options.q;
  if (options.sort) body.sort = options.sort;
  if (options.order) body.order = options.order;
  if (options.limit != null) body.limit = options.limit;
  if (options.offset != null) body.offset = options.offset;
  if (options.maxCalories != null) body.max_calories = options.maxCalories;
  if (options.minProtein != null) body.min_protein = options.minProtein;
  if (options.maxCarbs != null) body.max_carbs = options.maxCarbs;
  if (options.maxFat != null) body.max_fat = options.maxFat;

  const res = await fetchWithTimeout(`${BASE_URL}/meals/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await getApiError(res, `Search API error: ${res.status}`);
  return res.json();
}

// ─── Fetch meal combos ──────────────────────────────────────────────────────────

export interface ComboChain {
  id: string;
  name: string;
  logo: string;
  cuisine: string;
}

export interface ComboMeal {
  id: number;
  name: string;
  category: string;
  photo: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealCombo {
  chain: ComboChain;
  meals: ComboMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export async function getCombos(options: {
  chains: string[];
  maxCalories?: number;
  minProtein?: number;
  combosPerChain?: number;
  limit?: number;
}): Promise<MealCombo[]> {
  const body: Record<string, any> = { chains: options.chains };
  if (options.maxCalories != null) body.max_calories = options.maxCalories;
  if (options.minProtein != null) body.min_protein = options.minProtein;
  if (options.combosPerChain != null) body.combos_per_chain = options.combosPerChain;
  if (options.limit != null) body.limit = options.limit;

  const res = await fetchWithTimeout(`${BASE_URL}/combos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await getApiError(res, `Combos API error: ${res.status}`);
  const data = await res.json();
  return data.combos;
}

// ─── Fetch categories for a chain ──────────────────────────────────────────────

export async function getChainCategories(chainSlug: string): Promise<MealCategory[]> {
  const res = await fetchWithTimeout(`${BASE_URL}/chains/${chainSlug}/categories`);
  if (!res.ok) throw await getApiError(res, `Categories API error: ${res.status}`);
  const data = await res.json();
  return data.categories;
}

// ─── AI-powered meal recommendations ────────────────────────────────────────────

export interface RecommendationMeal {
  id: number;
  name: string;
  category: string;
  photo: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface RecommendationCombo {
  meals: RecommendationMeal[];
  drink: string | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface RecommendationCategory {
  name: string;
  description: string;
  combos: RecommendationCombo[];
}

export interface RecommendationResponse {
  chain: ComboChain;
  categories: RecommendationCategory[];
  tip: string;
}

// Session-scoped cache: one fetch per restaurant per app session
const recommendationCache = new Map<string, RecommendationResponse>();

export function clearRecommendationCache() {
  recommendationCache.clear();
}

export function getCachedRecommendation(chainSlug: string): RecommendationResponse | undefined {
  return recommendationCache.get(chainSlug);
}

// ─── Multi-chain AI feed ─────────────────────────────────────────────────────

export interface FeedCombo {
  chain: ComboChain;
  meals: ComboMeal[];
  drink: string | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface FeedCategory {
  name: string;
  description: string;
  combos: FeedCombo[];
}

export interface FeedResponse {
  categories: FeedCategory[];
  tip: string;
}

interface FeedCacheEntry {
  data: FeedResponse;
  timestamp: number;
  latitude: number;
  longitude: number;
}

const feedCache = new Map<string, FeedCacheEntry>();
const FEED_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const FEED_LOCATION_THRESHOLD = 0.015; // ~1 mile

function hasFeedContent(data: FeedResponse | null | undefined): boolean {
  return Boolean(
    data?.categories?.some((category) => (category.combos?.length ?? 0) > 0),
  );
}

function getFeedCacheKey(chains: string[], maxCalories?: number): string {
  return [...chains].sort().join(',') + (maxCalories != null ? `_${maxCalories}` : '');
}

export function getCachedFeed(
  chains: string[],
  maxCalories?: number,
  lat?: number,
  lng?: number,
): FeedResponse | null {
  const key = getFeedCacheKey(chains, maxCalories);
  const entry = feedCache.get(key);
  if (!entry || lat == null || lng == null) return null;
  if (!hasFeedContent(entry.data)) {
    feedCache.delete(key);
    return null;
  }
  const age = Date.now() - entry.timestamp;
  if (age > FEED_CACHE_TTL) return null;
  if (
    Math.abs(entry.latitude - lat) > FEED_LOCATION_THRESHOLD ||
    Math.abs(entry.longitude - lng) > FEED_LOCATION_THRESHOLD
  ) return null;
  return entry.data;
}

export async function getFeed(options: {
  chains: string[];
  description: string;
  maxCalories?: number;
  latitude: number;
  longitude: number;
}): Promise<FeedResponse> {
  const cached = getCachedFeed(options.chains, options.maxCalories, options.latitude, options.longitude);
  if (cached) return cached;

  const body: Record<string, any> = {
    chains: options.chains,
    description: options.description,
  };
  if (options.maxCalories != null) body.max_calories = options.maxCalories;

  const res = await fetchWithTimeout(`${BASE_URL}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await getApiError(res, `Feed API error: ${res.status}`);
  const data: FeedResponse = await res.json();

  const key = getFeedCacheKey(options.chains, options.maxCalories);
  if (hasFeedContent(data)) {
    feedCache.set(key, {
      data,
      timestamp: Date.now(),
      latitude: options.latitude,
      longitude: options.longitude,
    });
  } else {
    feedCache.delete(key);
  }

  return data;
}

export function clearFeedCache() {
  feedCache.clear();
}

// ─── AI-powered meal recommendations (single chain) ─────────────────────────

export async function getRecommendations(options: {
  chain: string;
  description: string;
  maxCalories?: number;
}): Promise<RecommendationResponse> {
  const cached = recommendationCache.get(options.chain);
  if (cached) return cached;

  const body: Record<string, any> = {
    chain: options.chain,
    description: options.description,
  };
  if (options.maxCalories != null) body.max_calories = options.maxCalories;

  const res = await fetchWithTimeout(`${BASE_URL}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await getApiError(res, `Recommendations API error: ${res.status}`);
  const data: RecommendationResponse = await res.json();
  recommendationCache.set(options.chain, data);
  return data;
}
