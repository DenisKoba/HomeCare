import type { NotificationPreferencesInput, UpdateProfileInput } from '@homecare/contracts';
import { apiRequest } from '@/lib/api';

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  locale: string;
  timezone: string;
  onboardingCompleted: boolean;
}

export interface NotificationPreferences extends NotificationPreferencesInput {
  userId: string;
  updatedAt: string;
}

export const profileKeys = {
  me: ['profile', 'me'] as const,
  notifications: ['profile', 'notifications'] as const,
};

export function getMe(): Promise<Profile> {
  return apiRequest<Profile>('/me');
}

export function updateMe(input: UpdateProfileInput): Promise<Profile> {
  return apiRequest<Profile>('/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>('/me/notification-preferences');
}

export function updateNotificationPreferences(
  input: NotificationPreferencesInput,
): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>('/me/notification-preferences', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
