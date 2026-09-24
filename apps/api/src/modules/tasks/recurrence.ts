import type { Recurrence } from '@homecare/contracts';

function atUtcMidnight(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const result = atUtcMidnight(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function nextDueDate(completedAt: Date, recurrence: Recurrence): Date | null {
  const completedDate = atUtcMidnight(completedAt);
  switch (recurrence.type) {
    case 'manual':
      return null;
    case 'interval':
      return addDays(completedDate, recurrence.every * (recurrence.unit === 'week' ? 7 : 1));
    case 'weekly': {
      for (let offset = 1; offset <= 7; offset += 1) {
        const candidate = addDays(completedDate, offset);
        const isoWeekday = candidate.getUTCDay() === 0 ? 7 : candidate.getUTCDay();
        if (recurrence.daysOfWeek.includes(isoWeekday)) return candidate;
      }
      return addDays(completedDate, 7);
    }
    case 'monthly': {
      const year = completedDate.getUTCFullYear();
      const month = completedDate.getUTCMonth() + 1;
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      return new Date(Date.UTC(year, month, Math.min(recurrence.dayOfMonth, lastDay)));
    }
  }
}

export function dueState(nextDueOn: Date | null, today: Date) {
  if (!nextDueOn) return 'not_due' as const;
  const days = Math.round(
    (atUtcMidnight(nextDueOn).getTime() - atUtcMidnight(today).getTime()) / 86_400_000,
  );
  if (days < 0) return 'overdue' as const;
  if (days === 0) return 'due' as const;
  if (days <= 3) return 'upcoming' as const;
  return 'not_due' as const;
}
