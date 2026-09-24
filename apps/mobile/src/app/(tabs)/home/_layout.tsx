import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Мій дім',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
      <Stack.Screen name="add-room" options={{ title: 'Нова кімната', presentation: 'modal' }} />
      <Stack.Screen name="rooms/[roomId]" options={{ title: 'Кімната' }} />
      <Stack.Screen name="members" options={{ title: 'Учасники', presentation: 'modal' }} />
    </Stack>
  );
}
