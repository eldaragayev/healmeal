import { Stack } from 'expo-router';

const sheetOptions = {
  presentation: 'formSheet' as const,
  headerShown: false,
  sheetAllowedDetents: [0.65, 1],
  sheetGrabberVisible: true,
  sheetCornerRadius: 20,
};

export default function SearchLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="filter" options={sheetOptions} />
      <Stack.Screen name="meal-detail" options={sheetOptions} />
      <Stack.Screen name="restaurant-detail" options={{ headerShown: false }} />
    </Stack>
  );
}
