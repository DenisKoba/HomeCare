import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  roomTypeSchema,
  type CompleteTaskInput,
  type CreateTaskInput,
  type Recurrence,
  type UpdateTaskInput,
} from '@homecare/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { HouseholdAccessService } from '../households/household-access.service';
import { dueState, nextDueDate } from './recurrence';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  async list(roomId: string, userId: string) {
    const room = await this.requireRoom(roomId, userId);
    return this.prisma.task.findMany({
      where: { roomId: room.id, archived: false },
      orderBy: [{ nextDueOn: 'asc' }, { priority: 'desc' }, { title: 'asc' }],
    });
  }

  async create(roomId: string, userId: string, input: CreateTaskInput) {
    const room = await this.requireRoom(roomId, userId);
    const assignment = await this.validateAssignment(
      room.householdId,
      input.assignmentMode,
      input.fixedAssigneeId ?? null,
      input.rotationMemberIds,
    );
    return this.prisma.task.create({
      data: {
        ...input,
        ...assignment,
        roomId,
        nextDueOn: new Date(),
        recurrence: input.recurrence,
      },
    });
  }

  async get(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { room: true, completions: { orderBy: { completedAt: 'desc' }, take: 10 } },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.access.requireMember(task.room.householdId, userId);
    return task;
  }

  async update(taskId: string, userId: string, input: UpdateTaskInput) {
    const task = await this.get(taskId, userId);
    const { version, ...data } = input;
    const assignment = await this.validateAssignment(
      task.room.householdId,
      input.assignmentMode ?? task.assignmentMode,
      input.fixedAssigneeId === undefined ? task.fixedAssigneeId : input.fixedAssigneeId,
      input.rotationMemberIds ?? task.rotationMemberIds,
    );
    const result = await this.prisma.task.updateMany({
      where: { id: taskId, version },
      data: {
        ...data,
        ...assignment,
        recurrence: data.recurrence,
        version: { increment: 1 },
      },
    });
    if (result.count === 0) throw new ConflictException('Task was changed by another device');
    return this.get(taskId, userId);
  }

  async archive(taskId: string, userId: string) {
    await this.get(taskId, userId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: { archived: true, version: { increment: 1 } },
    });
  }

  async complete(
    taskId: string,
    userId: string,
    idempotencyKey: string | undefined,
    input: CompleteTaskInput,
  ) {
    if (!idempotencyKey) throw new BadRequestException('Idempotency-Key header is required');
    const task = await this.get(taskId, userId);
    const completedAt = input.completedAt ? new Date(input.completedAt) : new Date();
    const recurrence = task.recurrence as unknown as Recurrence;

    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.taskCompletion.findUnique({
        where: { taskId_idempotencyKey: { taskId, idempotencyKey } },
      });
      if (existing) return existing;

      const completion = await transaction.taskCompletion.create({
        data: {
          taskId,
          completedById: userId,
          completedAt,
          actualMinutes: input.actualMinutes,
          note: input.note,
          idempotencyKey,
        },
      });
      await transaction.task.update({
        where: { id: taskId },
        data: {
          lastCompletedAt: completedAt,
          nextDueOn: nextDueDate(completedAt, recurrence),
          version: { increment: 1 },
        },
      });
      await transaction.dailyPlanItem.updateMany({
        where: { taskId, plan: { userId }, status: 'planned' },
        data: { status: 'completed', version: { increment: 1 } },
      });
      return completion;
    });
  }

  async undo(taskId: string, completionId: string, userId: string) {
    await this.get(taskId, userId);
    const completion = await this.prisma.taskCompletion.findFirst({
      where: { id: completionId, taskId },
    });
    if (!completion) throw new NotFoundException('Completion not found');

    await this.prisma.$transaction(async (transaction) => {
      await transaction.taskCompletion.update({
        where: { id: completion.id },
        data: { undoneAt: new Date() },
      });
      const latest = await transaction.taskCompletion.findFirst({
        where: { taskId, undoneAt: null },
        orderBy: { completedAt: 'desc' },
      });
      const task = await transaction.task.findUniqueOrThrow({ where: { id: taskId } });
      await transaction.task.update({
        where: { id: taskId },
        data: {
          lastCompletedAt: latest?.completedAt ?? null,
          nextDueOn: latest
            ? nextDueDate(latest.completedAt, task.recurrence as unknown as Recurrence)
            : new Date(),
          version: { increment: 1 },
        },
      });
    });
    return { undone: true };
  }

  async undoCompletion(completionId: string, userId: string) {
    const completion = await this.prisma.taskCompletion.findUnique({ where: { id: completionId } });
    if (!completion) throw new NotFoundException('Completion not found');
    return this.undo(completion.taskId, completionId, userId);
  }

  async listCompletions(taskId: string, userId: string) {
    await this.get(taskId, userId);
    const items = await this.prisma.taskCompletion.findMany({
      where: { taskId },
      orderBy: { completedAt: 'desc' },
      take: 100,
    });
    return { items, nextCursor: null };
  }

  async templates(roomType?: string) {
    const parsedRoomType = roomType ? roomTypeSchema.safeParse(roomType) : null;
    if (parsedRoomType && !parsedRoomType.success) {
      throw new BadRequestException('roomType is invalid');
    }
    const items = await this.prisma.taskTemplate.findMany({
      where: {
        enabled: true,
        ...(parsedRoomType?.success ? { roomType: parsedRoomType.data } : {}),
      },
      orderBy: { title: 'asc' },
    });
    return { items };
  }

  async due(householdId: string, userId: string, throughDate?: string) {
    await this.access.requireMember(householdId, userId);
    const through = throughDate ? new Date(`${throughDate}T00:00:00.000Z`) : new Date();
    if (Number.isNaN(through.getTime())) throw new BadRequestException('throughDate is invalid');
    const tasks = await this.prisma.task.findMany({
      where: {
        archived: false,
        room: { householdId, archived: false },
        OR: [{ nextDueOn: { lte: through } }, { priority: 'high' }],
      },
      include: { room: true },
      orderBy: [{ nextDueOn: 'asc' }, { priority: 'desc' }],
    });
    return tasks.map((task) => ({ ...task, dueState: dueState(task.nextDueOn, through) }));
  }

  private async requireRoom(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    await this.access.requireMember(room.householdId, userId);
    return room;
  }

  private async validateAssignment(
    householdId: string,
    assignmentMode: 'unassigned' | 'fixed' | 'rotation',
    fixedAssigneeId: string | null,
    rotationMemberIds: string[],
  ) {
    if (assignmentMode === 'unassigned') {
      return { assignmentMode, fixedAssigneeId: null, rotationMemberIds: [] };
    }

    const userIds =
      assignmentMode === 'fixed'
        ? fixedAssigneeId
          ? [fixedAssigneeId]
          : []
        : [...new Set(rotationMemberIds)];
    if (assignmentMode === 'fixed' && userIds.length !== 1) {
      throw new BadRequestException('A fixed assignee is required');
    }
    if (assignmentMode === 'rotation' && userIds.length < 2) {
      throw new BadRequestException('Rotation requires at least two members');
    }

    const membershipCount = await this.prisma.householdMember.count({
      where: { householdId, userId: { in: userIds } },
    });
    if (membershipCount !== userIds.length) {
      throw new BadRequestException('Every assignee must be a household member');
    }
    return {
      assignmentMode,
      fixedAssigneeId: assignmentMode === 'fixed' ? fixedAssigneeId : null,
      rotationMemberIds: assignmentMode === 'rotation' ? userIds : [],
    };
  }
}
