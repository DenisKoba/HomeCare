import { Button, FieldGroup, Host, ListItem } from '@expo/ui';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { NativeIcon } from '@/components/native-icon';
import { ensureDefaultHousehold, homeKeys } from '@/features/home/api';
import { listDueTasks, localDateString, taskKeys } from '@/features/tasks/api';

export default function CalendarScreen() {
  const localDate = localDateString();
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const householdId = householdQuery.data?.id ?? '';
  const tasksQuery = useQuery({
    queryKey: taskKeys.due(householdId, localDate),
    queryFn: () => listDueTasks(householdId, localDate),
    enabled: Boolean(householdId),
  });
  const tasks = tasksQuery.data ?? [];

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Задачі на сьогодні">
          {(householdQuery.isPending || tasksQuery.isPending) && <ListItem>Завантаження…</ListItem>}
          {!tasksQuery.isPending && tasks.length === 0 && (
            <ListItem supportingText="Додайте задачу на екрані «Сьогодні»">
              Немає задач для планування
            </ListItem>
          )}
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              leading={<NativeIcon name="schedule" />}
              supportingText={`${task.room?.name ?? 'Кімната'} · ${task.estimatedMinutes} хв`}
            >
              {task.title}
            </ListItem>
          ))}
        </FieldGroup.Section>

        <FieldGroup.Section title="Інтеграція">
          <ListItem
            leading={<NativeIcon name="calendar" />}
            supportingText="Apple Calendar на iOS · Google Calendar на Android"
          >
            Системний календар
          </ListItem>
          <Button
            label="Запланувати задачу"
            disabled={tasks.length === 0}
            onPress={() => router.push('/(tabs)/calendar/add-event')}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
