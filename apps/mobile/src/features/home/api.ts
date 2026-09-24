import type { CreateRoomInput, RoomType } from '@homecare/contracts';
import { apiRequest } from '@/lib/api';

export interface Household {
  id: string;
  name: string;
  timezone: string;
  version?: number;
}

export interface Room {
  id: string;
  householdId: string;
  name: string;
  type: RoomType;
  position: number;
  _count?: { tasks: number };
}

export interface RoomDetail extends Room {
  tasks: Array<{
    id: string;
    title: string;
    estimatedMinutes: number;
    nextDueOn: string | null;
  }>;
}

export interface HouseholdMember {
  id: string;
  role: 'owner' | 'member';
  joinedAt: string;
  user: { id: string; displayName: string | null; avatarUrl: string | null };
}

export interface HouseholdInvitation {
  id: string;
  role: 'owner' | 'member';
  expiresAt: string;
  createdAt: string;
}

export interface CreatedInvitation extends HouseholdInvitation {
  token: string;
  deepLink: string;
}

export const homeKeys = {
  household: ['home', 'household'] as const,
  rooms: (householdId: string) => ['home', 'household', householdId, 'rooms'] as const,
  room: (roomId: string) => ['home', 'room', roomId] as const,
  members: (householdId: string) => ['home', 'household', householdId, 'members'] as const,
  invitations: (householdId: string) => ['home', 'household', householdId, 'invitations'] as const,
};

const initialRooms: CreateRoomInput[] = [
  { name: 'Кухня', type: 'kitchen', position: 0 },
  { name: 'Ванна', type: 'bathroom', position: 1 },
  { name: 'Спальня', type: 'bedroom', position: 2 },
  { name: 'Вітальня', type: 'living_room', position: 3 },
];

export async function ensureDefaultHousehold(): Promise<Household> {
  const households = await apiRequest<Household[]>('/households');
  if (households[0]) return households[0];

  const household = await apiRequest<Household>('/households', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Мій дім',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }),
  });

  await Promise.all(initialRooms.map((room) => createRoom(household.id, room)));
  return household;
}

export function listRooms(householdId: string): Promise<Room[]> {
  return apiRequest<Room[]>(`/households/${householdId}/rooms`);
}

export function createRoom(householdId: string, input: CreateRoomInput): Promise<Room> {
  return apiRequest<Room>(`/households/${householdId}/rooms`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getRoom(roomId: string): Promise<RoomDetail> {
  return apiRequest<RoomDetail>(`/rooms/${roomId}`);
}

export function deleteRoom(roomId: string) {
  return apiRequest(`/rooms/${roomId}`, { method: 'DELETE' });
}

export async function listMembers(householdId: string): Promise<HouseholdMember[]> {
  const response = await apiRequest<{ items: HouseholdMember[] }>(
    `/households/${householdId}/members`,
  );
  return response.items;
}

export async function listInvitations(householdId: string): Promise<HouseholdInvitation[]> {
  const response = await apiRequest<{ items: HouseholdInvitation[] }>(
    `/households/${householdId}/invitations`,
  );
  return response.items;
}

export function createInvitation(
  householdId: string,
  expiresInHours: number,
): Promise<CreatedInvitation> {
  return apiRequest<CreatedInvitation>(`/households/${householdId}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ expiresInHours }),
  });
}

export function revokeInvitation(householdId: string, invitationId: string) {
  return apiRequest(`/households/${householdId}/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}

export function updateHousehold(
  householdId: string,
  input: { version: number; name?: string; timezone?: string },
): Promise<Household> {
  return apiRequest<Household>(`/households/${householdId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
