import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  notificationPreferencesSchema,
  updateProfileSchema,
  type NotificationPreferencesInput,
  type UpdateProfileInput,
} from '@homecare/contracts';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { ProfilesService } from './profiles.service';

@Controller('me')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.profiles.getOrCreate(user);
  }

  @Patch()
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) input: UpdateProfileInput,
  ) {
    return this.profiles.update(user, input);
  }

  @Get('notification-preferences')
  getNotificationPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.profiles.getNotificationPreferences(user);
  }

  @Patch('notification-preferences')
  updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(notificationPreferencesSchema))
    input: NotificationPreferencesInput,
  ) {
    return this.profiles.updateNotificationPreferences(user, input);
  }
}
