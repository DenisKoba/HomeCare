import { Button, FieldGroup, Host, ListItem, Picker, TextInput } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RoomType } from '@homecare/contracts';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { createRoom, ensureDefaultHousehold, homeKeys } from '@/features/home/api';

const roomTypes: Array<{ label: string; value: RoomType }> = [
  { label: 'Кухня', value: 'kitchen' },
  { label: 'Ванна кімната', value: 'bathroom' },
  { label: 'Спальня', value: 'bedroom' },
  { label: 'Вітальня', value: 'living_room' },
  { label: 'Коридор', value: 'hallway' },
  { label: 'Кабінет', value: 'office' },
  { label: 'Інше', value: 'other' },
];

export default function AddRoomScreen() {
  const [name, setName] = useState('');
  const [type, setType] = useState<RoomType>('other');
  const queryClient = useQueryClient();
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const household = await queryClient.fetchQuery({
        queryKey: homeKeys.household,
        queryFn: ensureDefaultHousehold,
      });
      const room = await createRoom(household.id, { name: name.trim(), type });
      return { householdId: household.id, room };
    },
    onSuccess: async ({ householdId }) => {
      await queryClient.invalidateQueries({ queryKey: homeKeys.rooms(householdId) });
      router.back();
    },
    onError: (error) => {
      Alert.alert(
        'Не вдалося додати кімнату',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      );
    },
  });

  const submit = () => {
    if (!name.trim()) {
      Alert.alert('Вкажіть назву', 'Наприклад: «Дитяча» або «Кабінет».');
      return;
    }
    createRoomMutation.mutate();
  };

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Назва кімнати">
          <TextInput
            placeholder="Наприклад, Кабінет"
            autoFocus
            autoCapitalize="sentences"
            maxLength={80}
            returnKeyType="done"
            onChangeText={setName}
            onSubmitEditing={submit}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title="Тип кімнати">
          <ListItem supportingText="Впливає на іконку й майбутні шаблони задач">
            Оберіть тип
          </ListItem>
          <Picker<RoomType> selectedValue={type} onValueChange={setType} appearance="menu">
            {roomTypes.map((roomType) => (
              <Picker.Item key={roomType.value} label={roomType.label} value={roomType.value} />
            ))}
          </Picker>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <Button
            label={createRoomMutation.isPending ? 'Збереження…' : 'Додати кімнату'}
            disabled={
              createRoomMutation.isPending || householdQuery.isPending || householdQuery.isError
            }
            onPress={submit}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
