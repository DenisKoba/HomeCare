import { Stack } from 'expo-router';

export function TabStack({ title }: { title: string }) {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title, headerLargeTitle: true, headerLargeTitleShadowVisible: false }}
      />
    </Stack>
  );
}
