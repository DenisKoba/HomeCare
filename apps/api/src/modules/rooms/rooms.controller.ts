import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  createRoomSchema,
  updateRoomSchema,
  type CreateRoomInput,
  type UpdateRoomInput,
} from '@homecare/contracts';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { RoomsService } from './rooms.service';

@Controller()
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get('households/:householdId/rooms')
  list(@CurrentUser() user: AuthenticatedUser, @Param('householdId') householdId: string) {
    return this.rooms.list(householdId, user.id);
  }

  @Post('households/:householdId/rooms')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('householdId') householdId: string,
    @Body(new ZodValidationPipe(createRoomSchema)) input: CreateRoomInput,
  ) {
    return this.rooms.create(householdId, user.id, input);
  }

  @Get('rooms/:roomId')
  get(@CurrentUser() user: AuthenticatedUser, @Param('roomId') roomId: string) {
    return this.rooms.get(roomId, user.id);
  }

  @Patch('rooms/:roomId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body(new ZodValidationPipe(updateRoomSchema)) input: UpdateRoomInput,
  ) {
    return this.rooms.update(roomId, user.id, input);
  }

  @Delete('rooms/:roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthenticatedUser, @Param('roomId') roomId: string) {
    await this.rooms.remove(roomId, user.id);
  }
}
