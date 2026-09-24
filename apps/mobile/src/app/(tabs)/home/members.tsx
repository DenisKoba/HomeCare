import { Button, FieldGroup, Host, ListItem, Picker } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Share } from 'react-native';
import { NativeIcon } from '@/components/native-icon';
import {
  createInvitation,
  ensureDefaultHousehold,
  homeKeys,
  listInvitations,
  listMembers,
  revokeInvitation,
} from '@/features/home/api';

export default function MembersScreen() {
  const [expiresInHours, setExpiresInHours] = useState(72);
  const queryClient = useQueryClient();
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const householdId = householdQuery.data?.id ?? '';
  const membersQuery = useQuery({
    queryKey: homeKeys.members(householdId),
    queryFn: () => listMembers(householdId),
    enabled: Boolean(householdId),
  });
  const invitationsQuery = useQuery({
    queryKey: homeKeys.invitations(householdId),
    queryFn: () => listInvitations(householdId),
    enabled: Boolean(householdId),
  });
  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(householdId, expiresInHours),
    onSuccess: async (invitation) => {
      await queryClient.invalidateQueries({ queryKey: homeKeys.invitations(householdId) });
      await Share.share({
        title: 'Запрошення в HomeCare',
        message: `Приєднуйся до дому «${householdQuery.data?.name ?? 'Мій дім'}» у HomeCare: ${invitation.deepLink}`,
      });
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося створити запрошення',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });
  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(householdId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: homeKeys.invitations(householdId) }),
  });

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Мешканці">
          {membersQuery.isPending && <ListItem>Завантаження…</ListItem>}
          {membersQuery.data?.map((member) => (
            <ListItem
              key={member.id}
              leading={<NativeIcon name="person" />}
              supportingText={member.role === 'owner' ? 'Власник' : 'Учасник'}
            >
              {member.user.displayName ?? 'Користувач HomeCare'}
            </ListItem>
          ))}
        </FieldGroup.Section>

        <FieldGroup.Section title="Нове запрошення">
          <Picker<number>
            selectedValue={expiresInHours}
            onValueChange={setExpiresInHours}
            appearance="menu"
          >
            <Picker.Item label="Діє 24 години" value={24} />
            <Picker.Item label="Діє 3 дні" value={72} />
            <Picker.Item label="Діє 7 днів" value={168} />
          </Picker>
          <Button
            label={inviteMutation.isPending ? 'Створення…' : 'Створити й поділитися'}
            disabled={inviteMutation.isPending || !householdId}
            onPress={() => inviteMutation.mutate()}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title="Активні запрошення">
          {invitationsQuery.data?.length === 0 && <ListItem>Активних запрошень немає</ListItem>}
          {invitationsQuery.data?.map((invitation) => (
            <ListItem
              key={invitation.id}
              onPress={() =>
                Alert.alert('Відкликати запрошення?', 'Посилання перестане працювати.', [
                  { text: 'Скасувати', style: 'cancel' },
                  {
                    text: 'Відкликати',
                    style: 'destructive',
                    onPress: () => revokeMutation.mutate(invitation.id),
                  },
                ])
              }
              supportingText={`Діє до ${new Date(invitation.expiresAt).toLocaleString('uk-UA')}`}
            >
              Запрошення для учасника
            </ListItem>
          ))}
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
