import { describe, expect, it } from 'vitest';
import { dueState, nextDueDate } from '../src/modules/tasks/recurrence';

describe('task recurrence', () => {
  it('advances interval rules from the completion date', () => {
    expect(
      nextDueDate(new Date('2026-09-17T18:30:00.000Z'), {
        type: 'interval',
        every: 2,
        unit: 'week',
      })?.toISOString(),
    ).toBe('2026-10-01T00:00:00.000Z');
  });

  it('finds the next configured weekday', () => {
    expect(
      nextDueDate(new Date('2026-09-17T10:00:00.000Z'), {
        type: 'weekly',
        daysOfWeek: [1, 6],
      })?.toISOString(),
    ).toBe('2026-09-19T00:00:00.000Z');
  });

  it('classifies due dates relative to the local planning date', () => {
    const today = new Date('2026-09-17T00:00:00.000Z');
    expect(dueState(new Date('2026-09-16T00:00:00.000Z'), today)).toBe('overdue');
    expect(dueState(new Date('2026-09-17T00:00:00.000Z'), today)).toBe('due');
    expect(dueState(new Date('2026-09-20T00:00:00.000Z'), today)).toBe('upcoming');
    expect(dueState(new Date('2026-09-21T00:00:00.000Z'), today)).toBe('not_due');
  });
});
