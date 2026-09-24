import { Button, FieldGroup, Host, ListItem, Picker } from '@expo/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { ensureDefaultHousehold, homeKeys } from '@/features/home/api';
import { listDueTasks, localDateString, taskKeys } from '@/features/tasks/api';
import { addPlanItemToCalendar, getWritableCalendars } from '@/lib/calendar';

type TimeChoice = 'next_hour' | 'evening' | 'tomorrow_morning';

function startDateFor(choice: TimeChoice) {
  const now = new Date();
  if (choice === 'next_hour') {
    const date = new Date(now);
    date.setHours(date.getHours() + 1, 0, 0, 0);
    return date;
  }
  if (choice === 'evening') {
    const date = new Date(now);
    date.setHours(18, 30, 0, 0);
    if (date <= now) date.setDate(date.getDate() + 1);
    return date;
  }
  const date = new Date(now);
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

export default function AddCalendarEventScreen() {
  const localDate = localDateString();
  const [taskId, setTaskId] = useState('');
  const [calendarId, setCalendarId] = useState('');
  const [timeChoice, setTimeChoice] = useState<TimeChoice>('next_hour');
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
  const calendarsQuery = useQuery({
    queryKey: ['calendars', 'writable'],
    queryFn: getWritableCalendars,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!taskId && tasksQuery.data?.[0]) setTaskId(tasksQuery.data[0].id);
  }, [taskId, tasksQuery.data]);
  useEffect(() => {
    if (!calendarId && calendarsQuery.data?.[0]) setCalendarId(calendarsQuery.data[0].id);
  }, [calendarId, calendarsQuery.data]);

  const selectedTask = useMemo(
    () => tasksQuery.data?.find((task) => task.id === taskId),
    [taskId, tasksQuery.data],
  );
  const selectedCalendar = useMemo(
    () => calendarsQuery.data?.find((calendar) => calendar.id === calendarId),
    [calendarId, calendarsQuery.data],
  );
  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedTask || !selectedCalendar) throw new Error('Оберіть задачу та календар');
      const startDate = startDateFor(timeChoice);
      const endDate = new Date(startDate.getTime() + selectedTask.estimatedMinutes * 60_000);
      await addPlanItemToCalendar({
        calendarId: selectedCalendar.id,
        title: selectedTask.title,
        roomName: selectedTask.room?.name ?? 'Дім',
        startDate,
        endDate,
      });
      return { calendarTitle: selectedCalendar.title };
    },
    onSuccess: ({ calendarTitle }) => {
      Alert.alert('Подію додано', `Задачу збережено в календарі «${calendarTitle}».`, [
        { text: 'Готово', onPress: () => router.back() },
      ]);
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося додати подію',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Задача">
          {tasksQuery.isPending ? (
            <ListItem>Завантаження…</ListItem>
          ) : (
            <Picker<string> selectedValue={taskId} onValueChange={setTaskId} appearance="menu">
              {(tasksQuery.data ?? []).map((task) => (
                <Picker.Item key={task.id} label={task.title} value={task.id} />
              ))}
            </Picker>
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title="Календар">
          {calendarsQuery.isPending && <ListItem>Запит доступу до календарів…</ListItem>}
          {!calendarsQuery.isPending && calendarsQuery.data?.length === 0 && (
            <ListItem supportingText="Дозвольте доступ у системних налаштуваннях">
              Немає доступного календаря
            </ListItem>
          )}
          {(calendarsQuery.data?.length ?? 0) > 0 && (
            <Picker<string>
              selectedValue={calendarId}
              onValueChange={setCalendarId}
              appearance="menu"
            >
              {calendarsQuery.data?.map((calendar) => (
                <Picker.Item key={calendar.id} label={calendar.title} value={calendar.id} />
              ))}
            </Picker>
          )}
        </FieldGroup.Section>

        <FieldGroup.Section title="Час">
          <Picker<TimeChoice>
            selectedValue={timeChoice}
            onValueChange={setTimeChoice}
            appearance="menu"
          >
            <Picker.Item label="Наступна повна година" value="next_hour" />
            <Picker.Item label="Сьогодні о 18:30" value="evening" />
            <Picker.Item label="Завтра о 09:00" value="tomorrow_morning" />
          </Picker>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <Button
            label={mutation.isPending ? 'Додавання…' : 'Додати в календар'}
            disabled={mutation.isPending || !selectedTask || !selectedCalendar}
            onPress={() => mutation.mutate()}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
