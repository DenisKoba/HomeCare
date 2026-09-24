import { FieldGroup, Host, ListItem } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { NativeIcon } from '@/components/native-icon';
import type { NativeIconName } from '@/components/native-icon';
import { RoomListItem } from '@/components/room-list-item';
import {
  deleteRoom,
  ensureDefaultHousehold,
  homeKeys,
  listRooms,
  type Room,
} from '@/features/home/api';

function iconForRoom(room: Room): NativeIconName {
  switch (room.type) {
    case 'kitchen':
      return 'kitchen';
    case 'bathroom':
      return 'bathroom';
    case 'bedroom':
      return 'bedroom';
    case 'living_room':
      return 'living';
    default:
      return 'home';
  }
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const roomsQuery = useQuery({
    queryKey: homeKeys.rooms(householdQuery.data?.id ?? ''),
    queryFn: () => listRooms(householdQuery.data!.id),
    enabled: Boolean(householdQuery.data?.id),
  });

  const error = householdQuery.error ?? roomsQuery.error;
  const rooms = roomsQuery.data ?? [];
  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: async (_result, roomId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
      queryClient.removeQueries({ queryKey: homeKeys.room(roomId) });
    },
    onError: (deleteError) =>
      Alert.alert(
        'Не вдалося видалити кімнату',
        deleteError instanceof Error ? deleteError.message : 'Спробуйте ще раз.',
      ),
  });

  const confirmDelete = (room: Room) => {
    if (deleteMutation.isPending) return;
    const taskCount = room._count?.tasks ?? 0;
    const message =
      taskCount > 0
        ? `Кімната та ${taskCount} пов’язаних задач зникнуть зі списків.`
        : 'Кімната зникне зі списку вашого дому.';
    Alert.alert(`Видалити «${room.name}»?`, message, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Видалити',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(room.id),
      },
    ]);
  };

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Кімнати">
          {(householdQuery.isPending || roomsQuery.isPending) && (
            <ListItem supportingText="Завантажуємо дані дому…">Завантаження</ListItem>
          )}
          {error && (
            <ListItem
              onPress={() => {
                void householdQuery.refetch();
                void roomsQuery.refetch();
              }}
              supportingText="Натисніть, щоб повторити"
            >
              Не вдалося завантажити кімнати
            </ListItem>
          )}
          {!error && !householdQuery.isPending && !roomsQuery.isPending && rooms.length === 0 && (
            <ListItem supportingText="Додайте першу кімнату нижче">Кімнат ще немає</ListItem>
          )}
          {rooms.map((room) => (
            <RoomListItem
              key={room.id}
              room={room}
              icon={iconForRoom(room)}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/home/rooms/[roomId]',
                  params: { roomId: room.id },
                })
              }
              onDelete={() => confirmDelete(room)}
            />
          ))}
        </FieldGroup.Section>

        <FieldGroup.Section title="Налаштування дому">
          <ListItem
            onPress={() => router.push('/(tabs)/home/add-room')}
            leading={<NativeIcon name="add" />}
          >
            Додати кімнату
          </ListItem>
          <ListItem
            onPress={() => router.push('/(tabs)/home/members')}
            leading={<NativeIcon name="person" />}
            supportingText="Перегляд і запрошення мешканців"
          >
            Учасники
          </ListItem>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
