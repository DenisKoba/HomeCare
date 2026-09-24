import { ListItem } from '@expo/ui';
import { Button, SwipeActions } from '@expo/ui/swift-ui';
import { NativeIcon } from '@/components/native-icon';
import type { RoomListItemProps } from '@/components/room-list-item';

export function RoomListItem({ room, icon, onPress, onDelete }: RoomListItemProps) {
  const taskCount = room._count?.tasks ?? 0;
  return (
    <SwipeActions>
      <ListItem
        onPress={onPress}
        leading={<NativeIcon name={icon} />}
        trailing={taskCount > 0 ? `${taskCount}` : undefined}
        supportingText={taskCount > 0 ? `${taskCount} активних задач` : 'Задач ще немає'}
      >
        {room.name}
      </ListItem>
      <SwipeActions.Actions edge="trailing" allowsFullSwipe>
        <Button label="Видалити" systemImage="trash" role="destructive" onPress={onDelete} />
      </SwipeActions.Actions>
    </SwipeActions>
  );
}
