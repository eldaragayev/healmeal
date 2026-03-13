import { NearbyMatch } from './types';
import { MOCK_NEARBY } from './mock-data';

export async function getNearbyRestaurants(
  _lat: number,
  _lng: number,
  radiusMiles: number
): Promise<NearbyMatch[]> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return MOCK_NEARBY.filter((match) => match.distance <= radiusMiles).sort(
    (a, b) => a.distance - b.distance
  );
}
