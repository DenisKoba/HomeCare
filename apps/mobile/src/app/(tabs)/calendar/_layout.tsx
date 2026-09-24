import { Stack } from 'expo-router';

export default function CalendarLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Календар',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="add-event"
        options={{ title: 'Запланувати задачу', presentation: 'modal' }}
      />
    </Stack>
  );
}
