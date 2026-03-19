import { useCallback, useEffect, useRef, useState } from 'react';
import { Meal, Filters, getSortOrder } from '@/api/types';
import { getChainMeals } from '@/api/client';

interface ChainMealsState {
  meals: Meal[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefetching: boolean; // true when loading but already have previous meals
}

// Global cache keyed by full param signature
const cache = new Map<string, { meals: Meal[]; total: number; hasMore: boolean }>();

function buildCacheKey(chainId: string, filters: Filters): string {
  return `${chainId}_${filters.sort}_${filters.maxCalories}_${filters.minProtein}_${filters.maxCarbs}_${filters.maxFat}`;
}

export function getCachedChainMeals(chainId: string, filters: Filters) {
  return cache.get(buildCacheKey(chainId, filters)) ?? null;
}

export function useChainMeals(chainId: string, filters: Filters, limit = 10) {
  const cacheKey = buildCacheKey(chainId, filters);
  const cached = cache.get(cacheKey);
  const prevMealsRef = useRef<Meal[]>([]);
  const prevChainRef = useRef<string>(chainId);
  const activeCacheKeyRef = useRef(cacheKey);
  const requestIdRef = useRef(0);
  const isPaginatingRef = useRef(false);

  // Reset previous meals if chain changed
  if (prevChainRef.current !== chainId) {
    prevMealsRef.current = [];
    prevChainRef.current = chainId;
  }

  const [state, setState] = useState<ChainMealsState>({
    meals: cached?.meals ?? prevMealsRef.current,
    total: cached?.total ?? 0,
    hasMore: cached?.hasMore ?? true,
    isLoading: !cached,
    isRefetching: !cached && prevMealsRef.current.length > 0,
  });

  activeCacheKeyRef.current = cacheKey;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    if (cached) {
      prevMealsRef.current = cached.meals;
      setState({ meals: cached.meals, total: cached.total, hasMore: cached.hasMore, isLoading: false, isRefetching: false });
      return () => {
        cancelled = true;
      };
    }

    const hasPrevious = prevMealsRef.current.length > 0;
    setState((s) => ({
      ...s,
      meals: hasPrevious ? prevMealsRef.current : [],
      isLoading: true,
      isRefetching: hasPrevious,
    }));

    getChainMeals(chainId, {
      sort: filters.sort,
      order: getSortOrder(filters.sort),
      limit,
      offset: 0,
      maxCalories: filters.maxCalories ?? undefined,
      minProtein: filters.minProtein ?? undefined,
      maxCarbs: filters.maxCarbs ?? undefined,
      maxFat: filters.maxFat ?? undefined,
    })
      .then(({ meals, total, hasMore }) => {
        if (cancelled || requestId !== requestIdRef.current || activeCacheKeyRef.current !== cacheKey) return;
        cache.set(cacheKey, { meals, total, hasMore });
        prevMealsRef.current = meals;
        setState({ meals, total, hasMore, isLoading: false, isRefetching: false });
      })
      .catch(() => {
        if (cancelled || requestId !== requestIdRef.current || activeCacheKeyRef.current !== cacheKey) return;
        setState((s) => ({ ...s, isLoading: false, isRefetching: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, chainId, filters.sort, filters.maxCalories, filters.minProtein, filters.maxCarbs, filters.maxFat, limit, cached]);

  const loadMore = useCallback(async () => {
    if (isPaginatingRef.current) return;

    const requestKey = cacheKey;
    // Read current state to avoid stale closure
    let currentLength = 0;
    let canLoadMore = false;
    setState((s) => {
      if (!s.hasMore || s.isLoading) return s;
      canLoadMore = true;
      currentLength = s.meals.length;
      return { ...s, isLoading: true };
    });
    if (!canLoadMore || currentLength === 0) return; // guard: nothing to paginate from

    isPaginatingRef.current = true;

    try {
      const { meals, total, hasMore } = await getChainMeals(chainId, {
        sort: filters.sort,
        order: getSortOrder(filters.sort),
        limit,
        offset: currentLength,
        maxCalories: filters.maxCalories ?? undefined,
        minProtein: filters.minProtein ?? undefined,
        maxCarbs: filters.maxCarbs ?? undefined,
        maxFat: filters.maxFat ?? undefined,
      });
      if (activeCacheKeyRef.current !== requestKey) return;
      setState((s) => {
        if (activeCacheKeyRef.current !== requestKey) return s;
        const merged = [...s.meals, ...meals];
        cache.set(cacheKey, { meals: merged, total, hasMore });
        prevMealsRef.current = merged;
        return { meals: merged, total, hasMore, isLoading: false, isRefetching: false };
      });
    } catch {
      if (activeCacheKeyRef.current !== requestKey) return;
      setState((s) => ({ ...s, isLoading: false, isRefetching: false }));
    } finally {
      isPaginatingRef.current = false;
    }
  }, [chainId, filters.sort, filters.maxCalories, filters.minProtein, filters.maxCarbs, filters.maxFat, limit, cacheKey]);

  return { ...state, loadMore };
}

export function clearMealsCache() {
  cache.clear();
}

/**
 * Prefetch meals for multiple chains with controlled concurrency.
 * Populates the global cache so individual useChainMeals hooks get instant hits.
 * Skips chains that are already cached for the given filters.
 */
const CONCURRENCY = 3;

export async function prefetchChainMeals(
  chainIds: string[],
  filters: Filters,
  limit = 10,
) {
  // Filter out already-cached chains
  const uncached = chainIds.filter((id) => !cache.has(buildCacheKey(id, filters)));
  if (uncached.length === 0) return;

  // Process in waves of CONCURRENCY
  for (let i = 0; i < uncached.length; i += CONCURRENCY) {
    const batch = uncached.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (chainId) => {
        try {
          const result = await getChainMeals(chainId, {
            sort: filters.sort,
            order: getSortOrder(filters.sort),
            limit,
            offset: 0,
            maxCalories: filters.maxCalories ?? undefined,
            minProtein: filters.minProtein ?? undefined,
            maxCarbs: filters.maxCarbs ?? undefined,
            maxFat: filters.maxFat ?? undefined,
          });
          cache.set(buildCacheKey(chainId, filters), result);
        } catch {}
      }),
    );
  }
}
