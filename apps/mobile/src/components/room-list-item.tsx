import { ListItem } from '@expo/ui';
import { NativeIcon, type NativeIconName } from '@/components/native-icon';
import type { Room } from '@/features/home/api';

export interface RoomListItemProps {
  room: Room;
  icon: NativeIconName;
  onPress: () => void;
  onDelete: () => void;
}

export function RoomListItem({ room, icon, onPress }: RoomListItemProps) {
  const taskCount = room._count?.tasks ?? 0;
  return (
    <ListItem
      onPress={onPress}
      leading={<NativeIcon name={icon} />}
      trailing={taskCount > 0 ? `${taskCount}` : undefined}
      supportingText={taskCount > 0 ? `${taskCount} активних задач` : 'Задач ще немає'}
    >
      {room.name}
    </ListItem>
  );
}
