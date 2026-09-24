import { describe, expect, it } from 'vitest';

import { generatePlan, type PlanningTask } from '../src';

const tasks: PlanningTask[] = [
  {
    id: 'overdue-low-effort',
    dueState: 'overdue',
    priority: 'normal',
    effort: 'low',
    estimatedMinutes: 10,
    lastCompletedAt: '2026-08-01T10:00:00.000Z',
    assignedTo: null,
  },
  {
    id: 'due-high-effort',
    dueState: 'due',
    priority: 'high',
    effort: 'high',
    estimatedMinutes: 25,
    lastCompletedAt: '2026-08-10T10:00:00.000Z',
    assignedTo: null,
  },
  {
    id: 'other-member',
    dueState: 'overdue',
    priority: 'high',
    effort: 'low',
    estimatedMinutes: 5,
    lastCompletedAt: null,
    assignedTo: 'another-user',
  },
];

describe('generatePlan', () => {
  it('prioritizes overdue work and respects the time budget', () => {
    const plan = generatePlan(tasks, {
      userId: 'current-user',
      energyLevel: 'low',
      timeBudgetMinutes: 30,
    });

    expect(plan.map((item) => item.taskId)).toEqual(['overdue-low-effort']);
  });

  it('does not include tasks assigned to another member by default', () => {
    const plan = generatePlan(tasks, {
      userId: 'current-user',
      energyLevel: 'high',
      timeBudgetMinutes: 60,
    });

    expect(plan.some((item) => item.taskId === 'other-member')).toBe(false);
  });

  it('is deterministic for the same input', () => {
    const options = {
      userId: 'current-user',
      energyLevel: 'normal' as const,
      timeBudgetMinutes: 60,
      includeAssignedToOthers: true,
    };

    expect(generatePlan(tasks, options)).toEqual(generatePlan(tasks, options));
  });
});
