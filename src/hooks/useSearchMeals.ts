import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NearbyMatch, Filters, getSortOrder } from '@/api/types';
import { searchMeals, SearchMeal } from '@/api/client';

export interface SearchResult {
  meal: SearchMeal;
  match: NearbyMatch | null; // null if chain not in nearby list (shouldn't happen)
}

interface SearchState {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
}

export function useSearchMeals(
  query: string,
  restaurants: NearbyMatch[],
  filters: Filters,
  restaurantFilter: string | null,
) {
  const [state, setState] = useState<SearchState>({
    results: [],
    total: 0,
    hasMore: false,
    isLoading: false,
  });

  const chainIds = useMemo(() => restaurants.map((r) => r.chain.id), [restaurants]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchIdRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  const chainMap = useMemo(() => {
    const map = new Map<string, NearbyMatch>();
    for (const r of restaurants) map.set(r.chain.id, r);
    return map;
  }, [restaurants]);

  const scopedChainIds = useMemo(() => {
    if (!restaurantFilter) return chainIds;
    return chainIds.filter((id) => {
      const match = chainMap.get(id);
      return match?.chain.name === restaurantFilter;
    });
  }, [restaurantFilter, chainIds, chainMap]);

  const doSearch = useCallback(async (q: string, offset: number, append: boolean) => {
    if (scopedChainIds.length === 0) {
      isLoadingMoreRef.current = false;
      setState({ results: [], total: 0, hasMore: false, isLoading: false });
      return;
    }

    const fetchId = ++fetchIdRef.current;
    if (append) {
      if (isLoadingMoreRef.current) return;
      isLoadingMoreRef.current = true;
    } else {
      isLoadingMoreRef.current = false;
    }

    setState((s) => ({ ...s, isLoading: true }));

    try {
      const data = await searchMeals({
        q: q || undefined,
        chains: scopedChainIds,
        sort: filters.sort,
        order: getSortOrder(filters.sort),
        limit: 20,
        offset,
        maxCalories: filters.maxCalories ?? undefined,
        minProtein: filters.minProtein ?? undefined,
        maxCarbs: filters.maxCarbs ?? undefined,
        maxFat: filters.maxFat ?? undefined,
      });

      // Stale response guard
      if (fetchId !== fetchIdRef.current) return;

      const results: SearchResult[] = data.meals.map((meal) => ({
        meal,
        match: chainMap.get(meal.chainId) ?? null,
      }));

      setState((prev) => ({
        results: append ? [...prev.results, ...results] : results,
        total: data.total,
        hasMore: data.hasMore,
        isLoading: false,
      }));
    } catch {
      if (fetchId === fetchIdRef.current) {
        setState((s) => ({ ...s, isLoading: false }));
      }
    } finally {
      if (append) isLoadingMoreRef.current = false;
    }
  }, [scopedChainIds, chainMap, filters.sort, filters.maxCalories, filters.minProtein, filters.maxCarbs, filters.maxFat]);

  // Debounced search on query/filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const delay = 300; // debounce all changes (query + filter-only) to batch requests
    debounceRef.current = setTimeout(() => {
      doSearch(query, 0, false);
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const loadMore = useCallback(() => {
    if (!state.hasMore || state.isLoading || isLoadingMoreRef.current) return;
    void doSearch(query, state.results.length, true);
  }, [query, state.hasMore, state.isLoading, state.results.length, doSearch]);

  return { ...state, loadMore };
}
