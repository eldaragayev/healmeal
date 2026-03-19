import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="weight-history"
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetAllowedDetents: [0.65, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 20,
        }}
      />
    </Stack>
  );
}
