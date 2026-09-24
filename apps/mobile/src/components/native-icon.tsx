import { Icon } from '@expo/ui';

export type NativeIconName =
  | 'add'
  | 'bathroom'
  | 'bedroom'
  | 'calendar'
  | 'check'
  | 'cleaning'
  | 'delete'
  | 'event'
  | 'home'
  | 'kitchen'
  | 'living'
  | 'notification'
  | 'person'
  | 'schedule'
  | 'unchecked';

interface NativeIconProps {
  name: NativeIconName;
  size?: number;
}

export function NativeIcon({ name, size = 24 }: NativeIconProps) {
  const icon = {
    add: Icon.select({ ios: 'plus.circle', android: import('@expo/material-symbols/add.xml') }),
    bathroom: Icon.select({
      ios: 'shower',
      android: import('@expo/material-symbols/bathroom.xml'),
    }),
    bedroom: Icon.select({ ios: 'bed.double', android: import('@expo/material-symbols/bed.xml') }),
    calendar: Icon.select({
      ios: 'calendar',
      android: import('@expo/material-symbols/calendar_month.xml'),
    }),
    check: Icon.select({
      ios: 'checkmark.circle.fill',
      android: import('@expo/material-symbols/check_circle.xml'),
    }),
    cleaning: Icon.select({
      ios: 'sparkles',
      android: import('@expo/material-symbols/cleaning_services.xml'),
    }),
    delete: Icon.select({
      ios: 'trash',
      android: import('@expo/material-symbols/delete.xml'),
    }),
    event: Icon.select({
      ios: 'calendar.badge.plus',
      android: import('@expo/material-symbols/event.xml'),
    }),
    home: Icon.select({ ios: 'house.fill', android: import('@expo/material-symbols/home.xml') }),
    kitchen: Icon.select({
      ios: 'fork.knife',
      android: import('@expo/material-symbols/kitchen.xml'),
    }),
    living: Icon.select({ ios: 'sofa.fill', android: import('@expo/material-symbols/living.xml') }),
    notification: Icon.select({
      ios: 'bell.fill',
      android: import('@expo/material-symbols/notifications.xml'),
    }),
    person: Icon.select({
      ios: 'person.crop.circle.fill',
      android: import('@expo/material-symbols/person.xml'),
    }),
    schedule: Icon.select({
      ios: 'clock.fill',
      android: import('@expo/material-symbols/schedule.xml'),
    }),
    unchecked: Icon.select({
      ios: 'circle',
      android: import('@expo/material-symbols/radio_button_unchecked.xml'),
    }),
  }[name];

  return <Icon name={icon} size={size} accessibilityLabel={name} />;
}
