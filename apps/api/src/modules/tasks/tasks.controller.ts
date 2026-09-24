import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import {
  completeTaskSchema,
  createTaskSchema,
  updateTaskSchema,
  type CompleteTaskInput,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@homecare/contracts';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('rooms/:roomId/tasks')
  list(@CurrentUser() user: AuthenticatedUser, @Param('roomId') roomId: string) {
    return this.tasks.list(roomId, user.id);
  }

  @Post('rooms/:roomId/tasks')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) input: CreateTaskInput,
  ) {
    return this.tasks.create(roomId, user.id, input);
  }

  @Get('tasks/:taskId')
  get(@CurrentUser() user: AuthenticatedUser, @Param('taskId') taskId: string) {
    return this.tasks.get(taskId, user.id);
  }

  @Patch('tasks/:taskId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) input: UpdateTaskInput,
  ) {
    return this.tasks.update(taskId, user.id, input);
  }

  @Delete('tasks/:taskId')
  archive(@CurrentUser() user: AuthenticatedUser, @Param('taskId') taskId: string) {
    return this.tasks.archive(taskId, user.id);
  }

  @Post('tasks/:taskId/completions')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(completeTaskSchema)) input: CompleteTaskInput,
  ) {
    return this.tasks.complete(taskId, user.id, idempotencyKey, input);
  }

  @Get('tasks/:taskId/completions')
  listCompletions(@CurrentUser() user: AuthenticatedUser, @Param('taskId') taskId: string) {
    return this.tasks.listCompletions(taskId, user.id);
  }

  @Post('tasks/:taskId/complete')
  completeAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body(new ZodValidationPipe(completeTaskSchema)) input: CompleteTaskInput,
  ) {
    return this.tasks.complete(taskId, user.id, idempotencyKey, input);
  }

  @Delete('tasks/:taskId/completions/:completionId')
  undo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('taskId') taskId: string,
    @Param('completionId') completionId: string,
  ) {
    return this.tasks.undo(taskId, completionId, user.id);
  }

  @Post('task-completions/:completionId/undo')
  undoAlias(@CurrentUser() user: AuthenticatedUser, @Param('completionId') completionId: string) {
    return this.tasks.undoCompletion(completionId, user.id);
  }

  @Get('households/:householdId/tasks/due')
  due(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Query('throughDate') throughDate?: string,
  ) {
    return this.tasks.due(householdId, user.id, throughDate);
  }

  @Get('households/:householdId/due-tasks')
  dueAlias(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Query('localDate') localDate?: string,
  ) {
    return this.tasks.due(householdId, user.id, localDate);
  }

  @Get('task-templates')
  templates(@Query('roomType') roomType?: string) {
    return this.tasks.templates(roomType);
  }
}
