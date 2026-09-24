import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const dailyReminderStorageKey = 'homecare.daily-plan-reminder-id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function schedulePlanReminder(title: string, body: string, date: Date) {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function setDailyPlanReminder(enabled: boolean) {
  const existingId = await SecureStore.getItemAsync(dailyReminderStorageKey);
  if (existingId) {
    await Notifications.cancelScheduledNotificationAsync(existingId).catch(() => undefined);
    await SecureStore.deleteItemAsync(dailyReminderStorageKey);
  }
  if (!enabled) return true;

  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'План HomeCare на сьогодні',
      body: 'Перегляньте задачі й оберіть, що зробити сьогодні.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
  await SecureStore.setItemAsync(dailyReminderStorageKey, id);
  return true;
}
