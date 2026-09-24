import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { upsertDeviceSchema, type UpsertDeviceInput } from '@homecare/contracts';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { DevicesService } from './devices.service';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Post()
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(upsertDeviceSchema)) input: UpsertDeviceInput,
  ) {
    return this.devices.upsert(user, input);
  }

  @Delete(':deviceId')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('deviceId') deviceId: string) {
    return this.devices.remove(user.id, deviceId);
  }
}
