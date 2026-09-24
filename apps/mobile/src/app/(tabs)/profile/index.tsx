import { Button, FieldGroup, Host, ListItem } from '@expo/ui';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { NativeIcon } from '@/components/native-icon';
import { useAuth } from '@/features/auth/auth-context';
import { ensureDefaultHousehold, homeKeys } from '@/features/home/api';
import { getMe, getNotificationPreferences, profileKeys } from '@/features/profile/api';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileQuery = useQuery({ queryKey: profileKeys.me, queryFn: getMe });
  const notificationsQuery = useQuery({
    queryKey: profileKeys.notifications,
    queryFn: getNotificationPreferences,
  });
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const profile = profileQuery.data;
  const preferences = notificationsQuery.data;
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      Alert.alert('Не вдалося вийти', error instanceof Error ? error.message : 'Спробуйте ще раз.');
      setIsSigningOut(false);
    }
  };

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Акаунт">
          <ListItem
            onPress={() => router.push('/(tabs)/profile/edit')}
            leading={<NativeIcon name="person" />}
            supportingText={profile?.timezone ?? 'Завантаження…'}
          >
            {profile?.displayName ?? 'Особисті дані'}
          </ListItem>
          <ListItem leading={<NativeIcon name="person" />} supportingText="Google">
            {session?.user.email ?? 'Авторизований користувач'}
          </ListItem>
          <Button
            label={isSigningOut ? 'Вихід…' : 'Вийти з акаунта'}
            variant="text"
            disabled={isSigningOut}
            onPress={() => void handleSignOut()}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title="Сповіщення">
          <ListItem
            onPress={() => router.push('/(tabs)/profile/notifications')}
            leading={<NativeIcon name="notification" />}
            supportingText={preferences?.dailyPlanEnabled ? 'Щодня о 09:00' : 'Вимкнено'}
          >
            Налаштувати сповіщення
          </ListItem>
        </FieldGroup.Section>

        <FieldGroup.Section title="Дані">
          <ListItem
            onPress={() => router.push('/(tabs)/profile/home-settings')}
            leading={<NativeIcon name="home" />}
            supportingText={householdQuery.data?.timezone ?? 'Завантаження…'}
          >
            {householdQuery.data?.name ?? 'Мій дім'}
          </ListItem>
          <ListItem
            onPress={() => router.push('/(tabs)/profile/edit')}
            leading={<NativeIcon name="calendar" />}
            supportingText={profile?.locale === 'uk' ? 'Українська' : (profile?.locale ?? '—')}
          >
            Мова й регіон
          </ListItem>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
