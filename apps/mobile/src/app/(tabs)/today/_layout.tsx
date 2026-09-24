import { Stack } from 'expo-router';

export default function TodayLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Сьогодні',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
      <Stack.Screen name="add-task" options={{ title: 'Нова задача', presentation: 'modal' }} />
      <Stack.Screen
        name="plan-settings"
        options={{ title: 'План на сьогодні', presentation: 'modal' }}
      />
    </Stack>
  );
}
