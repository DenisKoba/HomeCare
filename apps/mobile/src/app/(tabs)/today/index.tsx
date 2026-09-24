import { Button, FieldGroup, Host, ListItem } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { NativeIcon } from '@/components/native-icon';
import { ensureDefaultHousehold, homeKeys } from '@/features/home/api';
import {
  completeTask,
  getPlanForDate,
  listDueTasks,
  localDateString,
  taskKeys,
  type Task,
} from '@/features/tasks/api';

function dueLabel(task: Task, planned: boolean) {
  if (planned) return 'У плані';
  if (task.dueState === 'overdue') return 'Прострочено';
  if (task.dueState === 'due') return 'Сьогодні';
  if (task.dueState === 'upcoming') return 'Незабаром';
  return 'Без терміну';
}

export default function TodayScreen() {
  const queryClient = useQueryClient();
  const localDate = localDateString();
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const householdId = householdQuery.data?.id ?? '';
  const dueQuery = useQuery({
    queryKey: taskKeys.due(householdId, localDate),
    queryFn: () => listDueTasks(householdId, localDate),
    enabled: Boolean(householdId),
  });
  const planQuery = useQuery({
    queryKey: taskKeys.plan(householdId, localDate),
    queryFn: () => getPlanForDate(householdId, localDate),
    enabled: Boolean(householdId),
    retry: false,
  });
  const completionMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
      ]);
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося виконати задачу',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });

  const plan = planQuery.data;
  const plannedItems = plan?.items.filter((item) => item.status === 'planned') ?? [];
  const plannedIds = new Set(plannedItems.map((item) => item.task.id));
  const tasks = [
    ...plannedItems.map((item) => ({ task: item.task, planned: true })),
    ...(dueQuery.data ?? [])
      .filter((task) => !plannedIds.has(task.id))
      .map((task) => ({ task, planned: false })),
  ];
  const completedMinutes =
    plan?.items
      .filter((item) => item.status === 'completed')
      .reduce((sum, item) => sum + item.estimatedMinutes, 0) ?? 0;
  const totalMinutes = plan
    ? plan.items
        .filter((item) => item.status !== 'skipped')
        .reduce((sum, item) => sum + item.estimatedMinutes, 0)
    : tasks.reduce((sum, item) => sum + item.task.estimatedMinutes, 0);
  const loading = householdQuery.isPending || dueQuery.isPending || planQuery.isPending;
  const error = householdQuery.error ?? dueQuery.error ?? planQuery.error;

  const confirmCompletion = (task: Task) => {
    Alert.alert('Позначити виконаною?', task.title, [
      { text: 'Скасувати', style: 'cancel' },
      {
        text: 'Виконано',
        onPress: () => completionMutation.mutate(task.id),
      },
    ]);
  };

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Ваш план">
          <ListItem
            leading={<NativeIcon name="schedule" />}
            supportingText={
              plan
                ? `${completedMinutes} з ${totalMinutes} хв виконано`
                : `${tasks.length} задач · ${totalMinutes} хв`
            }
          >
            План на сьогодні
          </ListItem>
          <Button
            label={plan ? 'Перебудувати план' : 'Створити план'}
            variant="outlined"
            onPress={() => router.push('/(tabs)/today/plan-settings')}
          />
        </FieldGroup.Section>

        <FieldGroup.Section title="Задачі">
          {loading && <ListItem supportingText="Завантажуємо задачі…">Завантаження</ListItem>}
          {error && (
            <ListItem
              onPress={() => {
                void dueQuery.refetch();
                void planQuery.refetch();
              }}
              supportingText="Натисніть, щоб повторити"
            >
              Не вдалося завантажити задачі
            </ListItem>
          )}
          {!loading && !error && tasks.length === 0 && (
            <ListItem supportingText="Створіть першу задачу нижче">На сьогодні все чисто</ListItem>
          )}
          {tasks.map(({ task, planned }) => (
            <ListItem
              key={task.id}
              onPress={() => confirmCompletion(task)}
              leading={<NativeIcon name="unchecked" />}
              supportingText={`${task.room?.name ?? 'Кімната'} · ${task.estimatedMinutes} хв · ${dueLabel(task, planned)}`}
            >
              {task.title}
            </ListItem>
          ))}
        </FieldGroup.Section>

        <FieldGroup.Section title="Швидка дія">
          <ListItem
            onPress={() => router.push('/(tabs)/today/add-task')}
            leading={<NativeIcon name="add" />}
            supportingText="Одноразова або регулярна"
          >
            Додати задачу
          </ListItem>
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
