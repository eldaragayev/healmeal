import React, { createContext, useContext, useState, useCallback } from 'react';
import { Filters } from '@/api/types';

const DEFAULT_FILTERS: Filters = {
  maxCalories: null,
  minProtein: null,
  maxCarbs: null,
  maxFat: null,
  cuisine: null,
  sort: 'protein',
};

interface FilterContextValue {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  clearFilters: () => void;
  activeFilterCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeFilterCount =
    (filters.maxCalories !== null ? 1 : 0) +
    (filters.minProtein !== null ? 1 : 0) +
    (filters.maxCarbs !== null ? 1 : 0) +
    (filters.maxFat !== null ? 1 : 0) +
    (filters.cuisine !== null ? 1 : 0);

  return (
    <FilterContext value={{ filters, setFilters, clearFilters, activeFilterCount }}>
      {children}
    </FilterContext>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
