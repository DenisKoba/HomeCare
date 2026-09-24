import { Injectable } from '@nestjs/common';
import type { NotificationPreferencesInput, UpdateProfileInput } from '@homecare/contracts';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  getOrCreate(user: AuthenticatedUser) {
    return this.prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'New user',
        avatarUrl: user.avatarUrl,
        notificationPrefs: { create: {} },
      },
      update: user.avatarUrl ? { avatarUrl: user.avatarUrl } : {},
    });
  }

  async update(user: AuthenticatedUser, input: UpdateProfileInput) {
    await this.getOrCreate(user);
    return this.prisma.profile.update({ where: { id: user.id }, data: input });
  }

  async getNotificationPreferences(user: AuthenticatedUser) {
    await this.getOrCreate(user);
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
  }

  async updateNotificationPreferences(
    user: AuthenticatedUser,
    input: NotificationPreferencesInput,
  ) {
    await this.getOrCreate(user);
    return this.prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...input },
      update: input,
    });
  }
}
