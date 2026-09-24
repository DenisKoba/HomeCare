import { Button, FieldGroup, Host, ListItem, TextInput } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import {
  ensureDefaultHousehold,
  homeKeys,
  type Household,
  updateHousehold,
} from '@/features/home/api';

function HomeSettingsForm({ household }: { household: Household }) {
  const [name, setName] = useState(household.name);
  const queryClient = useQueryClient();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || household.timezone;
  const mutation = useMutation({
    mutationFn: () =>
      updateHousehold(household.id, {
        version: household.version ?? 1,
        name: name.trim(),
        timezone,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: homeKeys.household });
      router.back();
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося зберегти дім',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });
  const submit = () => {
    if (!name.trim()) {
      Alert.alert('Вкажіть назву дому');
      return;
    }
    mutation.mutate();
  };

  return (
    <FieldGroup>
      <FieldGroup.Section title="Назва дому">
        <TextInput
          defaultValue={household.name}
          placeholder="Мій дім"
          autoFocus
          maxLength={80}
          onChangeText={setName}
          onSubmitEditing={submit}
        />
      </FieldGroup.Section>
      <FieldGroup.Section title="Часовий пояс">
        <ListItem supportingText="Визначено автоматично">{timezone}</ListItem>
      </FieldGroup.Section>
      <FieldGroup.Section>
        <Button
          label={mutation.isPending ? 'Збереження…' : 'Зберегти'}
          disabled={mutation.isPending}
          onPress={submit}
        />
      </FieldGroup.Section>
    </FieldGroup>
  );
}

export default function HomeSettingsScreen() {
  const query = useQuery({ queryKey: homeKeys.household, queryFn: ensureDefaultHousehold });
  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      {query.data ? (
        <HomeSettingsForm household={query.data} />
      ) : (
        <FieldGroup>
          <FieldGroup.Section>
            <ListItem>{query.isError ? 'Не вдалося завантажити дім' : 'Завантаження…'}</ListItem>
          </FieldGroup.Section>
        </FieldGroup>
      )}
    </Host>
  );
}
