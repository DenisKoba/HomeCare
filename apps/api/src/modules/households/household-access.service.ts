import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class HouseholdAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMember(householdId: string, userId: string) {
    const membership = await this.prisma.householdMember.findUnique({
      where: { householdId_userId: { householdId, userId } },
    });
    if (!membership) throw new NotFoundException('Household not found');
    return membership;
  }

  async requireOwner(householdId: string, userId: string) {
    const membership = await this.requireMember(householdId, userId);
    if (membership.role !== 'owner') throw new ForbiddenException('Owner access is required');
    return membership;
  }
}
