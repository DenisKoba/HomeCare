import type {
  CreateTaskInput,
  DueState,
  Effort,
  EnergyLevel,
  Priority,
  Recurrence,
} from '@homecare/contracts';
import * as Crypto from 'expo-crypto';
import { ApiRequestError, apiRequest } from '@/lib/api';
import type { Room } from '@/features/home/api';

export interface Task {
  id: string;
  roomId: string;
  title: string;
  notes: string | null;
  estimatedMinutes: number;
  effort: Effort;
  priority: Priority;
  recurrence: Recurrence;
  nextDueOn: string | null;
  lastCompletedAt: string | null;
  dueState?: DueState;
  room?: Room;
}

export interface PlanItem {
  id: string;
  estimatedMinutes: number;
  status: 'planned' | 'completed' | 'skipped' | 'deferred';
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  task: Task & { room: Room };
}

export interface DailyPlan {
  id: string;
  version: number;
  timeBudgetMinutes: number;
  energyLevel: EnergyLevel;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  items: PlanItem[];
}

export const taskKeys = {
  all: ['tasks'] as const,
  due: (householdId: string, localDate: string) =>
    ['tasks', 'due', householdId, localDate] as const,
  room: (roomId: string) => ['tasks', 'room', roomId] as const,
  plan: (householdId: string, localDate: string) =>
    ['tasks', 'plan', householdId, localDate] as const,
};

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function listDueTasks(householdId: string, localDate: string): Promise<Task[]> {
  return apiRequest<Task[]>(
    `/households/${householdId}/tasks/due?throughDate=${encodeURIComponent(localDate)}`,
  );
}

export function listRoomTasks(roomId: string): Promise<Task[]> {
  return apiRequest<Task[]>(`/rooms/${roomId}/tasks`);
}

export function createTask(roomId: string, input: CreateTaskInput): Promise<Task> {
  return apiRequest<Task>(`/rooms/${roomId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function completeTask(taskId: string) {
  return apiRequest(`/tasks/${taskId}/completions`, {
    method: 'POST',
    headers: { 'Idempotency-Key': Crypto.randomUUID() },
    body: JSON.stringify({}),
  });
}

export async function getPlanForDate(
  householdId: string,
  localDate: string,
): Promise<DailyPlan | null> {
  try {
    return await apiRequest<DailyPlan>(`/households/${householdId}/plans/by-date/${localDate}`);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

export function generatePlan(
  householdId: string,
  input: {
    localDate: string;
    timezone: string;
    timeBudgetMinutes: number;
    energyLevel: EnergyLevel;
  },
): Promise<DailyPlan> {
  return apiRequest<DailyPlan>(`/households/${householdId}/plans/generate`, {
    method: 'POST',
    headers: { 'Idempotency-Key': Crypto.randomUUID() },
    body: JSON.stringify({
      ...input,
      includeAssignedToOthers: false,
      preserveManualItems: true,
    }),
  });
}
