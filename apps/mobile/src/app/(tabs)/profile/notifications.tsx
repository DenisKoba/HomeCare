import { Button, FieldGroup, Host, ListItem, Picker, Switch } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import {
  getNotificationPreferences,
  profileKeys,
  type NotificationPreferences,
  updateNotificationPreferences,
} from '@/features/profile/api';
import { setDailyPlanReminder } from '@/lib/notifications';

const quietHourOptions = ['', '21:00', '22:00', '23:00', '07:00', '08:00', '09:00'];

function NotificationsForm({ preferences }: { preferences: NotificationPreferences }) {
  const [dailyPlanEnabled, setDailyPlanEnabled] = useState(preferences.dailyPlanEnabled);
  const [assignmentEnabled, setAssignmentEnabled] = useState(preferences.assignmentEnabled);
  const [invitationEnabled, setInvitationEnabled] = useState(preferences.invitationEnabled);
  const [quietHoursStart, setQuietHoursStart] = useState(preferences.quietHoursStart ?? '');
  const [quietHoursEnd, setQuietHoursEnd] = useState(preferences.quietHoursEnd ?? '');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      updateNotificationPreferences({
        dailyPlanEnabled,
        assignmentEnabled,
        invitationEnabled,
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.notifications });
      const scheduled = await setDailyPlanReminder(dailyPlanEnabled);
      if (dailyPlanEnabled && !scheduled) {
        Alert.alert(
          'Налаштування збережено',
          'Дозвольте сповіщення в системних налаштуваннях, щоб отримувати нагадування.',
          [{ text: 'Готово', onPress: () => router.back() }],
        );
        return;
      }
      router.back();
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося зберегти сповіщення',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });

  return (
    <FieldGroup>
      <FieldGroup.Section title="Події">
        <Switch
          label="Щоденний план о 09:00"
          value={dailyPlanEnabled}
          onValueChange={setDailyPlanEnabled}
        />
        <Switch
          label="Призначені мені задачі"
          value={assignmentEnabled}
          onValueChange={setAssignmentEnabled}
        />
        <Switch
          label="Запрошення до дому"
          value={invitationEnabled}
          onValueChange={setInvitationEnabled}
        />
      </FieldGroup.Section>

      <FieldGroup.Section title="Не турбувати з">
        <Picker<string>
          selectedValue={quietHoursStart}
          onValueChange={setQuietHoursStart}
          appearance="menu"
        >
          {quietHourOptions.map((value) => (
            <Picker.Item key={`start-${value}`} label={value || 'Вимкнено'} value={value} />
          ))}
        </Picker>
      </FieldGroup.Section>
      <FieldGroup.Section title="Не турбувати до">
        <Picker<string>
          selectedValue={quietHoursEnd}
          onValueChange={setQuietHoursEnd}
          appearance="menu"
        >
          {quietHourOptions.map((value) => (
            <Picker.Item key={`end-${value}`} label={value || 'Вимкнено'} value={value} />
          ))}
        </Picker>
      </FieldGroup.Section>

      <FieldGroup.Section>
        <Button
          label={mutation.isPending ? 'Збереження…' : 'Зберегти'}
          disabled={mutation.isPending}
          onPress={() => mutation.mutate()}
        />
      </FieldGroup.Section>
    </FieldGroup>
  );
}

export default function NotificationsScreen() {
  const query = useQuery({
    queryKey: profileKeys.notifications,
    queryFn: getNotificationPreferences,
  });
  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      {query.data ? (
        <NotificationsForm preferences={query.data} />
      ) : (
        <FieldGroup>
          <FieldGroup.Section>
            <ListItem>{query.isError ? 'Не вдалося завантажити' : 'Завантаження…'}</ListItem>
          </FieldGroup.Section>
        </FieldGroup>
      )}
    </Host>
  );
}
