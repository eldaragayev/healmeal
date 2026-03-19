import { Stack } from 'expo-router';

const sheetOptions = {
  presentation: 'formSheet' as const,
  headerShown: false,
  sheetAllowedDetents: [0.65, 1],
  sheetGrabberVisible: true,
  sheetCornerRadius: 20,
};

export default function RestaurantsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="filter" options={sheetOptions} />
      <Stack.Screen name="meal-detail" options={sheetOptions} />
      <Stack.Screen name="combo-detail" />
      <Stack.Screen name="restaurant-detail" />
      <Stack.Screen name="restaurant-combos" />
      <Stack.Screen name="all-combos" />
      <Stack.Screen
        name="location-picker"
        options={{
          presentation: 'formSheet' as const,
          headerShown: false,
          sheetAllowedDetents: [0.85, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
        }}
      />
    </Stack>
  );
}
