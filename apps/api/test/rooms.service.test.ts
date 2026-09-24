import { describe, expect, it, vi } from 'vitest';
import { RoomsService } from '../src/modules/rooms/rooms.service';

describe('RoomsService', () => {
  it('permanently deletes a room after checking household access', async () => {
    const room = {
      id: '11111111-1111-4111-8111-111111111111',
      householdId: '22222222-2222-4222-8222-222222222222',
      tasks: [],
    };
    const prisma = {
      room: {
        findUnique: vi.fn().mockResolvedValue(room),
        delete: vi.fn().mockResolvedValue(room),
      },
    };
    const access = {
      requireMember: vi.fn().mockResolvedValue(undefined),
    };
    const service = new RoomsService(prisma as never, access as never);

    await service.remove(room.id, '33333333-3333-4333-8333-333333333333');

    expect(access.requireMember).toHaveBeenCalledWith(
      room.householdId,
      '33333333-3333-4333-8333-333333333333',
    );
    expect(prisma.room.delete).toHaveBeenCalledWith({ where: { id: room.id } });
  });
});
