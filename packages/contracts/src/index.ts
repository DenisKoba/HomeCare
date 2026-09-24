import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const timezoneSchema = z.string().min(1).max(100);

export const householdRoleSchema = z.enum(['owner', 'member']);
export const roomTypeSchema = z.enum([
  'kitchen',
  'bathroom',
  'bedroom',
  'living_room',
  'hallway',
  'office',
  'other',
]);
export const effortSchema = z.enum(['low', 'normal', 'high']);
export const prioritySchema = z.enum(['low', 'normal', 'high']);
export const dueStateSchema = z.enum(['not_due', 'upcoming', 'due', 'overdue']);
export const assignmentModeSchema = z.enum(['unassigned', 'fixed', 'rotation']);
export const energyLevelSchema = z.enum(['low', 'normal', 'high']);
export const planStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled']);
export const planItemStatusSchema = z.enum(['planned', 'completed', 'skipped', 'deferred']);
export const devicePlatformSchema = z.enum(['ios', 'android']);

export const recurrenceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('interval'),
    every: z.number().int().min(1).max(365),
    unit: z.enum(['day', 'week']),
  }),
  z.object({
    type: z.literal('weekly'),
    daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
  }),
  z.object({
    type: z.literal('monthly'),
    dayOfMonth: z.number().int().min(1).max(31),
  }),
  z.object({ type: z.literal('manual') }),
]);

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    avatarUrl: z.string().url().nullable().optional(),
    locale: z.string().min(2).max(20).optional(),
    timezone: timezoneSchema.optional(),
    onboardingCompleted: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const createHouseholdSchema = z.object({
  name: z.string().trim().min(1).max(80),
  timezone: timezoneSchema,
});

export const updateHouseholdSchema = z.object({
  version: z.number().int().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  timezone: timezoneSchema.optional(),
});

export const createRoomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: roomTypeSchema,
  position: z.number().int().min(0).optional(),
});

export const updateRoomSchema = z.object({
  version: z.number().int().min(1),
  name: z.string().trim().min(1).max(80).optional(),
  type: roomTypeSchema.optional(),
  position: z.number().int().min(0).optional(),
  archived: z.boolean().optional(),
});

const taskAssignmentSchema = z
  .object({
    assignmentMode: assignmentModeSchema,
    fixedAssigneeId: uuidSchema.nullable().optional(),
    rotationMemberIds: z.array(uuidSchema).default([]),
  })
  .superRefine((value, context) => {
    if (value.assignmentMode === 'fixed' && !value.fixedAssigneeId) {
      context.addIssue({
        code: 'custom',
        path: ['fixedAssigneeId'],
        message: 'A fixed assignee is required',
      });
    }
    if (value.assignmentMode === 'rotation' && value.rotationMemberIds.length < 2) {
      context.addIssue({
        code: 'custom',
        path: ['rotationMemberIds'],
        message: 'Rotation requires at least two members',
      });
    }
  });

const taskFieldsSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(2000).nullable().optional(),
  estimatedMinutes: z.number().int().min(1).max(480),
  effort: effortSchema,
  priority: prioritySchema,
  recurrence: recurrenceSchema,
});

export const createTaskSchema = z.intersection(
  taskFieldsSchema.extend({ templateId: uuidSchema.nullable().optional() }),
  taskAssignmentSchema,
);

export const updateTaskSchema = z
  .object({
    version: z.number().int().min(1),
    title: z.string().trim().min(1).max(120).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    estimatedMinutes: z.number().int().min(1).max(480).optional(),
    effort: effortSchema.optional(),
    priority: prioritySchema.optional(),
    recurrence: recurrenceSchema.optional(),
    assignmentMode: assignmentModeSchema.optional(),
    fixedAssigneeId: uuidSchema.nullable().optional(),
    rotationMemberIds: z.array(uuidSchema).optional(),
    archived: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (value.assignmentMode === 'fixed' && value.fixedAssigneeId === null) {
      context.addIssue({
        code: 'custom',
        path: ['fixedAssigneeId'],
        message: 'A fixed assignee is required',
      });
    }
  });

export const completeTaskSchema = z
  .object({
    completedAt: isoDateTimeSchema.optional(),
    actualMinutes: z.number().int().min(1).max(1440).nullable().optional(),
    note: z.string().trim().max(1000).nullable().optional(),
  })
  .default({});

export const generatePlanSchema = z.object({
  localDate: isoDateSchema,
  timezone: timezoneSchema,
  timeBudgetMinutes: z.number().int().min(5).max(240),
  energyLevel: energyLevelSchema,
  roomIds: z.array(uuidSchema).optional(),
  includeAssignedToOthers: z.boolean().default(false),
  preserveManualItems: z.boolean().default(true),
  expectedPlanVersion: z.number().int().min(1).nullable().optional(),
});

export const notificationPreferencesSchema = z.object({
  dailyPlanEnabled: z.boolean(),
  assignmentEnabled: z.boolean(),
  invitationEnabled: z.boolean(),
  quietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  quietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
});

export const upsertDeviceSchema = z.object({
  installationId: uuidSchema,
  platform: devicePlatformSchema,
  expoPushToken: z.string().max(512).nullable().optional(),
  locale: z.string().min(2).max(20),
  timezone: timezoneSchema,
  appVersion: z.string().min(1).max(30),
  notificationsEnabled: z.boolean(),
});

export const createInvitationSchema = z.object({
  expiresInHours: z.number().int().min(1).max(168).default(72),
});

export type HouseholdRole = z.infer<typeof householdRoleSchema>;
export type RoomType = z.infer<typeof roomTypeSchema>;
export type Effort = z.infer<typeof effortSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type DueState = z.infer<typeof dueStateSchema>;
export type AssignmentMode = z.infer<typeof assignmentModeSchema>;
export type EnergyLevel = z.infer<typeof energyLevelSchema>;
export type Recurrence = z.infer<typeof recurrenceSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type UpsertDeviceInput = z.infer<typeof upsertDeviceSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
