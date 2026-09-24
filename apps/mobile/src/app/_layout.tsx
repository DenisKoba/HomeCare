import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/features/auth/auth-context';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="sign-in"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
