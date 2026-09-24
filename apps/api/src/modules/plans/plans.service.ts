import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { GeneratePlanInput } from '@homecare/contracts';
import { generatePlan } from '@homecare/planning';
import { PrismaService } from '../../common/database/prisma.service';
import { HouseholdAccessService } from '../households/household-access.service';
import { dueState } from '../tasks/recurrence';
import type { UpdatePlanInput } from './plans.controller';

function parseLocalDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('localDate is invalid');
  return date;
}

@Injectable()
export class PlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  async generate(
    householdId: string,
    userId: string,
    idempotencyKey: string | undefined,
    input: GeneratePlanInput,
  ) {
    if (!idempotencyKey) throw new BadRequestException('Idempotency-Key header is required');
    await this.access.requireMember(householdId, userId);

    const existingRequest = await this.prisma.dailyPlan.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: this.planInclude,
    });
    if (existingRequest) return existingRequest;

    const localDate = parseLocalDate(input.localDate);
    const existingPlan = await this.prisma.dailyPlan.findUnique({
      where: { householdId_userId_localDate: { householdId, userId, localDate } },
      include: { items: true },
    });
    if (
      existingPlan &&
      input.expectedPlanVersion != null &&
      existingPlan.version !== input.expectedPlanVersion
    ) {
      throw new ConflictException('Plan was changed by another device');
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        archived: false,
        room: {
          householdId,
          archived: false,
          ...(input.roomIds?.length ? { id: { in: input.roomIds } } : {}),
        },
      },
    });

    const selected = generatePlan(
      tasks.map((task) => ({
        id: task.id,
        dueState: dueState(task.nextDueOn, localDate),
        priority: task.priority,
        effort: task.effort,
        estimatedMinutes: task.estimatedMinutes,
        lastCompletedAt: task.lastCompletedAt?.toISOString() ?? null,
        assignedTo: task.assignmentMode === 'fixed' ? task.fixedAssigneeId : null,
      })),
      {
        userId,
        energyLevel: input.energyLevel,
        timeBudgetMinutes: input.timeBudgetMinutes,
        includeAssignedToOthers: input.includeAssignedToOthers,
      },
    );

    return this.prisma.$transaction(async (transaction) => {
      const plan = existingPlan
        ? await transaction.dailyPlan.update({
            where: { id: existingPlan.id },
            data: {
              timezone: input.timezone,
              timeBudgetMinutes: input.timeBudgetMinutes,
              energyLevel: input.energyLevel,
              status: 'active',
              idempotencyKey,
              version: { increment: 1 },
            },
          })
        : await transaction.dailyPlan.create({
            data: {
              householdId,
              userId,
              localDate,
              timezone: input.timezone,
              timeBudgetMinutes: input.timeBudgetMinutes,
              energyLevel: input.energyLevel,
              status: 'active',
              idempotencyKey,
            },
          });

      const manualItems =
        input.preserveManualItems && existingPlan
          ? existingPlan.items.filter((item) => item.reason === 'manual')
          : [];
      await transaction.dailyPlanItem.deleteMany({
        where: {
          planId: plan.id,
          ...(input.preserveManualItems ? { reason: { not: 'manual' } } : {}),
        },
      });

      if (selected.length) {
        await transaction.dailyPlanItem.createMany({
          data: selected.map((item, index) => ({
            planId: plan.id,
            taskId: item.taskId,
            position: manualItems.length + index,
            estimatedMinutes: item.estimatedMinutes,
            reason: item.reason,
          })),
          skipDuplicates: true,
        });
      }

      return transaction.dailyPlan.findUniqueOrThrow({
        where: { id: plan.id },
        include: this.planInclude,
      });
    });
  }

  async get(planId: string, userId: string) {
    const plan = await this.prisma.dailyPlan.findUnique({
      where: { id: planId },
      include: this.planInclude,
    });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.access.requireMember(plan.householdId, userId);
    return plan;
  }

  async getByDate(householdId: string, userId: string, localDate: string) {
    await this.access.requireMember(householdId, userId);
    const plan = await this.prisma.dailyPlan.findUnique({
      where: {
        householdId_userId_localDate: {
          householdId,
          userId,
          localDate: parseLocalDate(localDate),
        },
      },
      include: this.planInclude,
    });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async update(planId: string, userId: string, input: UpdatePlanInput) {
    await this.get(planId, userId);
    const {
      version,
      items,
      status,
      timeBudgetMinutes,
      energyLevel,
      scheduledStartAt,
      scheduledEndAt,
    } = input;
    const result = await this.prisma.dailyPlan.updateMany({
      where: { id: planId, version },
      data: {
        status,
        timeBudgetMinutes,
        energyLevel,
        scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : scheduledStartAt,
        scheduledEndAt: scheduledEndAt ? new Date(scheduledEndAt) : scheduledEndAt,
        version: { increment: 1 },
      },
    });
    if (result.count === 0) throw new ConflictException('Plan was changed by another device');

    if (items?.length) {
      await this.prisma.$transaction(
        items.map((item) => {
          const { id, version: itemVersion, ...data } = item;
          return this.prisma.dailyPlanItem.updateMany({
            where: { id, planId, version: itemVersion },
            data: {
              ...data,
              scheduledStartAt: data.scheduledStartAt
                ? new Date(data.scheduledStartAt)
                : data.scheduledStartAt,
              scheduledEndAt: data.scheduledEndAt
                ? new Date(data.scheduledEndAt)
                : data.scheduledEndAt,
              version: { increment: 1 },
            },
          });
        }),
      );
    }
    return this.get(planId, userId);
  }

  async addItem(
    planId: string,
    userId: string,
    input: { planVersion: number; taskId: string; position?: number },
  ) {
    const plan = await this.get(planId, userId);
    const task = await this.prisma.task.findFirst({
      where: { id: input.taskId, room: { householdId: plan.householdId }, archived: false },
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.dailyPlan.updateMany({
        where: { id: planId, version: input.planVersion },
        data: { version: { increment: 1 } },
      });
      if (!updated.count) throw new ConflictException('Plan was changed by another device');
      const position =
        input.position ?? (await transaction.dailyPlanItem.count({ where: { planId } }));
      await transaction.dailyPlanItem.create({
        data: {
          planId,
          taskId: task.id,
          position,
          estimatedMinutes: task.estimatedMinutes,
          reason: 'manual',
        },
      });
    });
    return this.get(planId, userId);
  }

  async updateItem(
    planId: string,
    itemId: string,
    userId: string,
    input: {
      planVersion: number;
      status?: 'planned' | 'completed' | 'skipped' | 'deferred';
      position?: number;
    },
  ) {
    await this.get(planId, userId);
    await this.prisma.$transaction(async (transaction) => {
      const updatedPlan = await transaction.dailyPlan.updateMany({
        where: { id: planId, version: input.planVersion },
        data: { version: { increment: 1 } },
      });
      if (!updatedPlan.count) throw new ConflictException('Plan was changed by another device');
      const updatedItem = await transaction.dailyPlanItem.updateMany({
        where: { id: itemId, planId },
        data: { status: input.status, position: input.position, version: { increment: 1 } },
      });
      if (!updatedItem.count) throw new NotFoundException('Plan item not found');
    });
    return this.get(planId, userId);
  }

  async removeItem(planId: string, itemId: string, userId: string, planVersion: number) {
    if (!Number.isInteger(planVersion) || planVersion < 1) {
      throw new BadRequestException('version query parameter is required');
    }
    await this.get(planId, userId);
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.dailyPlan.updateMany({
        where: { id: planId, version: planVersion },
        data: { version: { increment: 1 } },
      });
      if (!updated.count) throw new ConflictException('Plan was changed by another device');
      const removed = await transaction.dailyPlanItem.deleteMany({ where: { id: itemId, planId } });
      if (!removed.count) throw new NotFoundException('Plan item not found');
    });
    return this.get(planId, userId);
  }

  private readonly planInclude = {
    items: {
      include: { task: { include: { room: true } } },
      orderBy: { position: 'asc' as const },
    },
  };
}
