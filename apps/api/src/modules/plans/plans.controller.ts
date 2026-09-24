import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import {
  generatePlanSchema,
  isoDateTimeSchema,
  planItemStatusSchema,
  type GeneratePlanInput,
} from '@homecare/contracts';
import { z } from 'zod';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { PlansService } from './plans.service';

const updatePlanSchema = z.object({
  version: z.number().int().min(1),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  timeBudgetMinutes: z.number().int().min(5).max(240).optional(),
  energyLevel: z.enum(['low', 'normal', 'high']).optional(),
  scheduledStartAt: isoDateTimeSchema.nullable().optional(),
  scheduledEndAt: isoDateTimeSchema.nullable().optional(),
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        version: z.number().int().min(1),
        position: z.number().int().min(0).optional(),
        status: planItemStatusSchema.optional(),
        scheduledStartAt: isoDateTimeSchema.nullable().optional(),
        scheduledEndAt: isoDateTimeSchema.nullable().optional(),
      }),
    )
    .optional(),
});

type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

const addPlanItemSchema = z.object({
  planVersion: z.number().int().min(1),
  taskId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
});

const updatePlanItemSchema = z.object({
  planVersion: z.number().int().min(1),
  status: planItemStatusSchema.optional(),
  position: z.number().int().min(0).optional(),
});

@Controller()
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Post('households/:householdId/plans/generate')
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(generatePlanSchema)) input: GeneratePlanInput,
  ) {
    return this.plans.generate(householdId, user.id, idempotencyKey, input);
  }

  @Get('plans/:planId')
  get(@CurrentUser() user: AuthenticatedUser, @Param('planId') planId: string) {
    return this.plans.get(planId, user.id);
  }

  @Get('households/:householdId/plans/by-date/:localDate')
  getByDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Param('localDate') localDate: string,
  ) {
    return this.plans.getByDate(householdId, user.id, localDate);
  }

  @Get('households/:householdId/daily-plans/:localDate')
  getByDateAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Param('localDate') localDate: string,
  ) {
    return this.plans.getByDate(householdId, user.id, localDate);
  }

  @Patch('plans/:planId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('planId') planId: string,
    @Body(new ZodValidationPipe(updatePlanSchema)) input: UpdatePlanInput,
  ) {
    return this.plans.update(planId, user.id, input);
  }

  @Post('plans/:planId/items')
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('planId') planId: string,
    @Body(new ZodValidationPipe(addPlanItemSchema)) input: z.infer<typeof addPlanItemSchema>,
  ) {
    return this.plans.addItem(planId, user.id, input);
  }

  @Patch('plans/:planId/items/:itemId')
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updatePlanItemSchema)) input: z.infer<typeof updatePlanItemSchema>,
  ) {
    return this.plans.updateItem(planId, itemId, user.id, input);
  }

  @Delete('plans/:planId/items/:itemId')
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Query('version') version: string,
  ) {
    return this.plans.removeItem(planId, itemId, user.id, Number(version));
  }
}

export type { UpdatePlanInput };
