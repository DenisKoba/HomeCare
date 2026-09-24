import { Button, FieldGroup, Host, ListItem } from '@expo/ui';
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/auth-context';
import { getMe, profileKeys } from '@/features/profile/api';

export default function TabLayout() {
  const { session, isInitializing, signOut } = useAuth();
  const profileQuery = useQuery({
    queryKey: profileKeys.me,
    queryFn: getMe,
    enabled: Boolean(session) && !isInitializing,
  });

  if (isInitializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  if (profileQuery.isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <ActivityIndicator />
        <Text>Завантажуємо ваш профіль…</Text>
        <Text style={{ color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 }}>
          Після паузи серверу може знадобитися до 20 секунд, щоб прокинутися.
        </Text>
      </View>
    );
  }

  if (profileQuery.isError) {
    return (
      <Host style={{ flex: 1 }} useViewportSizeMeasurement>
        <FieldGroup>
          <FieldGroup.Section title="Не вдалося завантажити профіль">
            <ListItem supportingText="Перевірте підключення до HomeCare API та спробуйте ще раз.">
              Дані користувача недоступні
            </ListItem>
            <Button label="Спробувати ще раз" onPress={() => void profileQuery.refetch()} />
            <Button label="Вийти" variant="text" onPress={() => void signOut()} />
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    );
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="today">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }}
          md={{ default: 'check_circle', selected: 'check_circle' }}
        />
        <NativeTabs.Trigger.Label>Сьогодні</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home' }}
        />
        <NativeTabs.Trigger.Label>Дім</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
        <NativeTabs.Trigger.Label>Календар</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md={{ default: 'person', selected: 'person' }}
        />
        <NativeTabs.Trigger.Label>Профіль</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
