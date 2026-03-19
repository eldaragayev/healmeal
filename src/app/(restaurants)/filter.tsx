import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { useSettings } from '@/hooks/useSettings';
import { useNearbyChains } from '@/hooks/useNearbyChains';
import { FilterSheetContent } from '@/components/FilterSheet';
import { getUniqueCuisines } from '@/utils/filters';

export default function FilterModal() {
  const router = useRouter();
  const { filters, setFilters } = useFilters();
  const { settings, updateSettings } = useSettings();
  const { restaurants } = useNearbyChains(settings.distanceRadius);
  const cuisines = useMemo(() => getUniqueCuisines(restaurants), [restaurants]);

  return (
    <FilterSheetContent
      filters={filters}
      cuisines={cuisines}
      distanceRadius={settings.distanceRadius}
      onFiltersChange={setFilters}
      onDistanceChange={(val) => updateSettings({ distanceRadius: val })}
      onClose={() => router.back()}
    />
  );
}
