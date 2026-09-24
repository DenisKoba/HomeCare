import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateInvitationInput, HouseholdRole } from '@homecare/contracts';
import { createHash, randomBytes } from 'node:crypto';
import type { AuthenticatedUser } from '../../common/auth/auth.types';
import { PrismaService } from '../../common/database/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { HouseholdAccessService } from './household-access.service';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class HouseholdCollaborationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
    private readonly profiles: ProfilesService,
  ) {}

  async listMembers(householdId: string, userId: string) {
    await this.access.requireMember(householdId, userId);
    const items = await this.prisma.householdMember.findMany({
      where: { householdId },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
    return { items };
  }

  async updateMember(householdId: string, memberId: string, userId: string, role: HouseholdRole) {
    await this.access.requireOwner(householdId, userId);
    const member = await this.requireMembership(householdId, memberId);
    if (member.role === 'owner' && role === 'member') await this.requireAnotherOwner(householdId);
    return this.prisma.householdMember.update({ where: { id: memberId }, data: { role } });
  }

  async removeMember(householdId: string, memberId: string, userId: string) {
    const actingMembership = await this.access.requireMember(householdId, userId);
    const target = await this.requireMembership(householdId, memberId);
    const removingSelf = actingMembership.id === target.id;
    if (!removingSelf && actingMembership.role !== 'owner') {
      throw new ForbiddenException('Owner access is required');
    }
    if (target.role === 'owner') await this.requireAnotherOwner(householdId);
    await this.prisma.householdMember.delete({ where: { id: target.id } });
    return { deleted: true };
  }

  async listInvitations(householdId: string, userId: string) {
    await this.access.requireOwner(householdId, userId);
    const items = await this.prisma.householdInvitation.findMany({
      where: { householdId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, householdId: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { items };
  }

  async createInvitation(householdId: string, userId: string, input: CreateInvitationInput) {
    await this.access.requireOwner(householdId, userId);
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + input.expiresInHours * 3_600_000);
    const invitation = await this.prisma.householdInvitation.create({
      data: {
        householdId,
        createdById: userId,
        tokenHash: hashToken(token),
        expiresAt,
      },
      select: { id: true, householdId: true, role: true, expiresAt: true, createdAt: true },
    });
    return { ...invitation, token, deepLink: `homecare://invitations/${token}` };
  }

  async revokeInvitation(householdId: string, invitationId: string, userId: string) {
    await this.access.requireOwner(householdId, userId);
    const result = await this.prisma.householdInvitation.deleteMany({
      where: { id: invitationId, householdId },
    });
    if (!result.count) throw new NotFoundException('Invitation not found');
    return { deleted: true };
  }

  async preview(token: string) {
    const invitation = await this.findInvitation(token);
    this.ensureActive(invitation);
    return {
      householdName: invitation.household.name,
      invitedByName: invitation.createdBy.displayName ?? 'HomeCare user',
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(token: string, user: AuthenticatedUser) {
    await this.profiles.getOrCreate(user);
    const invitation = await this.findInvitation(token);
    if (invitation.expiresAt <= new Date()) throw new GoneException('Invitation has expired');
    if (invitation.acceptedAt) {
      const membership = await this.prisma.householdMember.findUnique({
        where: { householdId_userId: { householdId: invitation.householdId, userId: user.id } },
      });
      if (!membership) throw new GoneException('Invitation has already been used');
      return invitation.household;
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.householdMember.upsert({
        where: { householdId_userId: { householdId: invitation.householdId, userId: user.id } },
        create: { householdId: invitation.householdId, userId: user.id, role: invitation.role },
        update: {},
      });
      const updated = await transaction.householdInvitation.updateMany({
        where: { id: invitation.id, acceptedAt: null },
        data: { acceptedAt: new Date() },
      });
      if (!updated.count) throw new ConflictException('Invitation was accepted on another device');
      return transaction.household.findUniqueOrThrow({ where: { id: invitation.householdId } });
    });
  }

  private async findInvitation(token: string) {
    const invitation = await this.prisma.householdInvitation.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { household: true, createdBy: true },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    return invitation;
  }

  private ensureActive(invitation: { acceptedAt: Date | null; expiresAt: Date }) {
    if (invitation.acceptedAt) throw new GoneException('Invitation has already been used');
    if (invitation.expiresAt <= new Date()) throw new GoneException('Invitation has expired');
  }

  private async requireMembership(householdId: string, memberId: string) {
    const member = await this.prisma.householdMember.findFirst({
      where: { id: memberId, householdId },
    });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  private async requireAnotherOwner(householdId: string) {
    const owners = await this.prisma.householdMember.count({
      where: { householdId, role: 'owner' },
    });
    if (owners <= 1) throw new ConflictException('A household must have at least one owner');
  }
}
