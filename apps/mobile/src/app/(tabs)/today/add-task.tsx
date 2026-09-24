import { Button, FieldGroup, Host, ListItem, Picker, TextInput } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Priority, Recurrence } from '@homecare/contracts';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ensureDefaultHousehold, homeKeys, listRooms } from '@/features/home/api';
import { createTask, taskKeys } from '@/features/tasks/api';

type RecurrenceChoice = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

function recurrenceFor(choice: RecurrenceChoice): Recurrence {
  switch (choice) {
    case 'daily':
      return { type: 'interval', every: 1, unit: 'day' };
    case 'weekly':
      return { type: 'interval', every: 1, unit: 'week' };
    case 'biweekly':
      return { type: 'interval', every: 2, unit: 'week' };
    case 'monthly':
      return { type: 'monthly', dayOfMonth: new Date().getDate() };
    default:
      return { type: 'manual' };
  }
}

export default function AddTaskScreen() {
  const params = useLocalSearchParams<{ roomId?: string }>();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [roomId, setRoomId] = useState(params.roomId ?? '');
  const [minutes, setMinutes] = useState(15);
  const [priority, setPriority] = useState<Priority>('normal');
  const [recurrence, setRecurrence] = useState<RecurrenceChoice>('weekly');
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const householdId = householdQuery.data?.id ?? '';
  const roomsQuery = useQuery({
    queryKey: homeKeys.rooms(householdId),
    queryFn: () => listRooms(householdId),
    enabled: Boolean(householdId),
  });

  useEffect(() => {
    if (!roomId && roomsQuery.data?.[0]) setRoomId(roomsQuery.data[0].id);
  }, [roomId, roomsQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      createTask(roomId, {
        title: title.trim(),
        notes: notes.trim() || null,
        estimatedMinutes: minutes,
        effort: minutes <= 10 ? 'low' : minutes >= 45 ? 'high' : 'normal',
        priority,
        recurrence: recurrenceFor(recurrence),
        assignmentMode: 'unassigned',
        rotationMemberIds: [],
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ]);
      router.back();
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося додати задачу',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });

  const submit = () => {
    if (!title.trim()) {
      Alert.alert('Вкажіть назву задачі');
      return;
    }
    if (!roomId) {
      Alert.alert('Оберіть кімнату');
      return;
    }
    mutation.mutate();
  };

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Задача">
          <TextInput
            placeholder="Наприклад, Помити підлогу"
            autoFocus
            maxLength={120}
            returnKeyType="next"
            onChangeText={setTitle}
          />
          <TextInput
            placeholder="Нотатка (необов’язково)"
            multiline
            numberOfLines={2}
            maxLength={2000}
            onChangeText={setNotes}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title="Кімната">
          {roomsQuery.isPending ? (
            <ListItem>Завантаження кімнат…</ListItem>
          ) : (
            <Picker<string> selectedValue={roomId} onValueChange={setRoomId} appearance="menu">
              {(roomsQuery.data ?? []).map((room) => (
                <Picker.Item key={room.id} label={room.name} value={room.id} />
              ))}
            </Picker>
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title="Тривалість">
          <Picker<number> selectedValue={minutes} onValueChange={setMinutes} appearance="menu">
            {[5, 10, 15, 20, 30, 45, 60, 90].map((value) => (
              <Picker.Item key={value} label={`${value} хв`} value={value} />
            ))}
          </Picker>
        </FieldGroup.Section>

        <FieldGroup.Section title="Повторення">
          <Picker<RecurrenceChoice>
            selectedValue={recurrence}
            onValueChange={setRecurrence}
            appearance="menu"
          >
            <Picker.Item label="Одноразово" value="once" />
            <Picker.Item label="Щодня" value="daily" />
            <Picker.Item label="Щотижня" value="weekly" />
            <Picker.Item label="Кожні два тижні" value="biweekly" />
            <Picker.Item label="Щомісяця" value="monthly" />
          </Picker>
        </FieldGroup.Section>

        <FieldGroup.Section title="Пріоритет">
          <Picker<Priority> selectedValue={priority} onValueChange={setPriority} appearance="menu">
            <Picker.Item label="Низький" value="low" />
            <Picker.Item label="Звичайний" value="normal" />
            <Picker.Item label="Високий" value="high" />
          </Picker>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <Button
            label={mutation.isPending ? 'Збереження…' : 'Додати задачу'}
            disabled={mutation.isPending || roomsQuery.isPending || !roomId}
            onPress={submit}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
