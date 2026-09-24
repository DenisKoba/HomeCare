import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Профіль',
          headerLargeTitle: true,
          headerLargeTitleShadowVisible: false,
        }}
      />
      <Stack.Screen name="edit" options={{ title: 'Особисті дані', presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ title: 'Сповіщення', presentation: 'modal' }} />
      <Stack.Screen
        name="home-settings"
        options={{ title: 'Налаштування дому', presentation: 'modal' }}
      />
    </Stack>
  );
}
