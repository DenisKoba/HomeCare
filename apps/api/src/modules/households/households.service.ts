import { ConflictException, Injectable } from '@nestjs/common';
import type { CreateHouseholdInput, UpdateHouseholdInput } from '@homecare/contracts';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/database/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { HouseholdAccessService } from './household-access.service';

@Injectable()
export class HouseholdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
    private readonly access: HouseholdAccessService,
  ) {}

  list(userId: string) {
    return this.prisma.household.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: { include: { user: true } },
        _count: { select: { rooms: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(user: AuthenticatedUser, input: CreateHouseholdInput) {
    await this.profiles.getOrCreate(user);
    return this.prisma.household.create({
      data: {
        ...input,
        members: { create: { userId: user.id, role: 'owner' } },
      },
      include: { members: true },
    });
  }

  async get(householdId: string, userId: string) {
    await this.access.requireMember(householdId, userId);
    return this.prisma.household.findUniqueOrThrow({
      where: { id: householdId },
      include: {
        members: { include: { user: true } },
        rooms: { where: { archived: false }, orderBy: [{ position: 'asc' }, { name: 'asc' }] },
      },
    });
  }

  async update(householdId: string, userId: string, input: UpdateHouseholdInput) {
    await this.access.requireOwner(householdId, userId);
    const { version, ...data } = input;
    const result = await this.prisma.household.updateMany({
      where: { id: householdId, version },
      data: { ...data, version: { increment: 1 } },
    });
    if (result.count === 0) throw new ConflictException('Household was changed by another device');
    return this.get(householdId, userId);
  }

  async remove(householdId: string, userId: string) {
    await this.access.requireOwner(householdId, userId);
    await this.prisma.household.delete({ where: { id: householdId } });
    return { deleted: true };
  }
}
