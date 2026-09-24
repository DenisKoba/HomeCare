import { Button, FieldGroup, Host, ListItem, Picker, TextInput } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { getMe, profileKeys, type Profile, updateMe } from '@/features/profile/api';

function ProfileForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [locale, setLocale] = useState(profile.locale || 'uk');
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      updateMe({
        displayName: displayName.trim(),
        locale,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || profile.timezone,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.me });
      router.back();
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося зберегти профіль',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });
  const submit = () => {
    if (!displayName.trim()) {
      Alert.alert('Вкажіть ім’я');
      return;
    }
    mutation.mutate();
  };

  return (
    <FieldGroup>
      <FieldGroup.Section title="Ім’я">
        <TextInput
          defaultValue={profile.displayName ?? ''}
          placeholder="Ваше ім’я"
          autoFocus
          maxLength={80}
          onChangeText={setDisplayName}
          onSubmitEditing={submit}
        />
      </FieldGroup.Section>
      <FieldGroup.Section title="Мова">
        <Picker<string> selectedValue={locale} onValueChange={setLocale} appearance="menu">
          <Picker.Item label="Українська" value="uk" />
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Español" value="es" />
        </Picker>
      </FieldGroup.Section>
      <FieldGroup.Section title="Часовий пояс">
        <ListItem>{Intl.DateTimeFormat().resolvedOptions().timeZone}</ListItem>
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

export default function EditProfileScreen() {
  const profileQuery = useQuery({ queryKey: profileKeys.me, queryFn: getMe });
  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      {profileQuery.data ? (
        <ProfileForm profile={profileQuery.data} />
      ) : (
        <FieldGroup>
          <FieldGroup.Section>
            <ListItem>
              {profileQuery.isError ? 'Не вдалося завантажити профіль' : 'Завантаження…'}
            </ListItem>
          </FieldGroup.Section>
        </FieldGroup>
      )}
    </Host>
  );
}
