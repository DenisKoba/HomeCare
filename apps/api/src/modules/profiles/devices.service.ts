import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpsertDeviceInput } from '@homecare/contracts';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/database/prisma.service';
import { ProfilesService } from './profiles.service';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
  ) {}

  async upsert(user: AuthenticatedUser, input: UpsertDeviceInput) {
    await this.profiles.getOrCreate(user);
    return this.prisma.device.upsert({
      where: { userId_installationId: { userId: user.id, installationId: input.installationId } },
      create: { userId: user.id, ...input },
      update: { ...input, lastSeenAt: new Date() },
    });
  }

  async remove(userId: string, deviceId: string) {
    const result = await this.prisma.device.deleteMany({ where: { id: deviceId, userId } });
    if (!result.count) throw new NotFoundException('Device not found');
    return { deleted: true };
  }
}
