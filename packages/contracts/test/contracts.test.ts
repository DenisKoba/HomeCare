import { describe, expect, it } from 'vitest';
import { createTaskSchema, generatePlanSchema } from '../src';

describe('API contracts', () => {
  it('requires a member for fixed task assignment', () => {
    const result = createTaskSchema.safeParse({
      title: 'Пропилососити',
      estimatedMinutes: 20,
      effort: 'normal',
      priority: 'normal',
      recurrence: { type: 'interval', every: 1, unit: 'week' },
      assignmentMode: 'fixed',
      rotationMemberIds: [],
    });
    expect(result.success).toBe(false);
  });

  it('applies safe plan generation defaults', () => {
    const result = generatePlanSchema.parse({
      localDate: '2026-09-17',
      timezone: 'Europe/Madrid',
      timeBudgetMinutes: 45,
      energyLevel: 'normal',
    });
    expect(result.includeAssignedToOthers).toBe(false);
    expect(result.preserveManualItems).toBe(true);
  });
});
