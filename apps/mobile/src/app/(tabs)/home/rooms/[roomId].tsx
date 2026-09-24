import { FieldGroup, Host, ListItem } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { NativeIcon } from '@/components/native-icon';
import { deleteRoom, getRoom, homeKeys } from '@/features/home/api';

export default function RoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const queryClient = useQueryClient();
  const roomQuery = useQuery({
    queryKey: homeKeys.room(roomId),
    queryFn: () => getRoom(roomId),
    enabled: Boolean(roomId),
  });
  const room = roomQuery.data;
  const deleteMutation = useMutation({
    mutationFn: () => deleteRoom(roomId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
      queryClient.removeQueries({ queryKey: homeKeys.room(roomId) });
      router.back();
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося видалити кімнату',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });

  const confirmDelete = () => {
    if (!room || deleteMutation.isPending) return;
    const tasksWarning =
      room.tasks.length > 0
        ? `Кімната та ${room.tasks.length} пов’язаних задач зникнуть зі списків.`
        : 'Кімната зникне зі списку вашого дому.';
    Alert.alert(`Видалити «${room.name}»?`, tasksWarning, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Кімната">
          <ListItem
            leading={<NativeIcon name="home" />}
            supportingText={room ? `${room.tasks.length} активних задач` : 'Завантаження…'}
          >
            {room?.name ?? 'Кімната'}
          </ListItem>
        </FieldGroup.Section>

        <FieldGroup.Section title="Задачі">
          {roomQuery.isError && (
            <ListItem onPress={() => void roomQuery.refetch()} supportingText="Натисніть повторити">
              Не вдалося завантажити кімнату
            </ListItem>
          )}
          {room && room.tasks.length === 0 && <ListItem>Задач ще немає</ListItem>}
          {room?.tasks.map((task) => (
            <ListItem
              key={task.id}
              leading={<NativeIcon name="unchecked" />}
              supportingText={`${task.estimatedMinutes} хв`}
            >
              {task.title}
            </ListItem>
          ))}
        </FieldGroup.Section>

        <FieldGroup.Section title="Дія">
          <ListItem
            onPress={() =>
              router.push({
                pathname: '/(tabs)/today/add-task',
                params: { roomId },
              })
            }
            leading={<NativeIcon name="add" />}
          >
            Додати задачу в цю кімнату
          </ListItem>
        </FieldGroup.Section>

        <FieldGroup.Section title="Керування">
          <ListItem
            onPress={confirmDelete}
            leading={<NativeIcon name="delete" />}
            supportingText={
              deleteMutation.isPending ? 'Видалення…' : 'Кімната та її задачі зникнуть зі списків'
            }
          >
            Видалити кімнату
          </ListItem>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
