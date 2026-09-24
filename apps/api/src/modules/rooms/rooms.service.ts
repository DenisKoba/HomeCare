import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateRoomInput, UpdateRoomInput } from '@homecare/contracts';
import { PrismaService } from '../../common/database/prisma.service';
import { HouseholdAccessService } from '../households/household-access.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HouseholdAccessService,
  ) {}

  async list(householdId: string, userId: string) {
    await this.access.requireMember(householdId, userId);
    return this.prisma.room.findMany({
      where: { householdId, archived: false },
      include: { _count: { select: { tasks: { where: { archived: false } } } } },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  }

  async create(householdId: string, userId: string, input: CreateRoomInput) {
    await this.access.requireMember(householdId, userId);
    const position =
      input.position ?? (await this.prisma.room.count({ where: { householdId, archived: false } }));
    return this.prisma.room.create({ data: { ...input, position, householdId } });
  }

  async get(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { tasks: { where: { archived: false }, orderBy: { title: 'asc' } } },
    });
    if (!room) throw new NotFoundException('Room not found');
    await this.access.requireMember(room.householdId, userId);
    return room;
  }

  async update(roomId: string, userId: string, input: UpdateRoomInput) {
    const room = await this.get(roomId, userId);
    const { version, ...data } = input;
    const result = await this.prisma.room.updateMany({
      where: { id: roomId, householdId: room.householdId, version },
      data: { ...data, version: { increment: 1 } },
    });
    if (result.count === 0) throw new ConflictException('Room was changed by another device');
    return this.get(roomId, userId);
  }

  async archive(roomId: string, userId: string) {
    const room = await this.get(roomId, userId);
    return this.prisma.room.update({
      where: { id: room.id },
      data: { archived: true, version: { increment: 1 } },
    });
  }
}
