import { Button, FieldGroup, Host, Picker } from '@expo/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EnergyLevel } from '@homecare/contracts';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { ensureDefaultHousehold, homeKeys } from '@/features/home/api';
import { generatePlan, localDateString, taskKeys } from '@/features/tasks/api';

export default function PlanSettingsScreen() {
  const [minutes, setMinutes] = useState(45);
  const [energy, setEnergy] = useState<EnergyLevel>('normal');
  const queryClient = useQueryClient();
  const householdQuery = useQuery({
    queryKey: homeKeys.household,
    queryFn: ensureDefaultHousehold,
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const household = await queryClient.fetchQuery({
        queryKey: homeKeys.household,
        queryFn: ensureDefaultHousehold,
      });
      return generatePlan(household.id, {
        localDate: localDateString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        timeBudgetMinutes: minutes,
        energyLevel: energy,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      router.back();
    },
    onError: (error) =>
      Alert.alert(
        'Не вдалося створити план',
        error instanceof Error ? error.message : 'Спробуйте ще раз.',
      ),
  });

  return (
    <Host style={{ flex: 1 }} useViewportSizeMeasurement>
      <FieldGroup>
        <FieldGroup.Section title="Скільки часу є сьогодні">
          <Picker<number> selectedValue={minutes} onValueChange={setMinutes} appearance="menu">
            {[15, 30, 45, 60, 90, 120, 180].map((value) => (
              <Picker.Item key={value} label={`${value} хв`} value={value} />
            ))}
          </Picker>
        </FieldGroup.Section>

        <FieldGroup.Section title="Рівень енергії">
          <Picker<EnergyLevel> selectedValue={energy} onValueChange={setEnergy} appearance="menu">
            <Picker.Item label="Низький" value="low" />
            <Picker.Item label="Звичайний" value="normal" />
            <Picker.Item label="Високий" value="high" />
          </Picker>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <Button
            label={mutation.isPending ? 'Створення плану…' : 'Створити план'}
            disabled={mutation.isPending || householdQuery.isPending || householdQuery.isError}
            onPress={() => mutation.mutate()}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}
