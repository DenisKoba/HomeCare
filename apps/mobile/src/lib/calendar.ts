import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export async function getWritableCalendars() {
  const permission = await Calendar.requestCalendarPermissionsAsync();
  if (!permission.granted) return [];
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return calendars.filter((calendar) => {
    const provider = [calendar.source.name, calendar.source.type, calendar.ownerAccount]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const isGoogleOrApple =
      provider.includes('google') ||
      provider.includes('gmail') ||
      provider.includes('icloud') ||
      provider.includes('apple') ||
      provider.includes('mobileme') ||
      (Platform.OS === 'ios' && calendar.source.type === Calendar.SourceType.LOCAL);
    return calendar.allowsModifications && isGoogleOrApple;
  });
}

export async function addPlanItemToCalendar(input: {
  calendarId: string;
  title: string;
  roomName: string;
  startDate: Date;
  endDate: Date;
}) {
  return Calendar.createEventAsync(input.calendarId, {
    title: input.title,
    notes: `HomeCare · ${input.roomName}`,
    startDate: input.startDate,
    endDate: input.endDate,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    alarms: [{ relativeOffset: -15 }],
    calendarId: Platform.OS === 'ios' ? input.calendarId : undefined,
  });
}
