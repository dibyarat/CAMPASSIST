import { describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

const prismaMock = {
  user: { findUnique: vi.fn() },
};

describe('UsersService.getProfile', () => {
  it('includes the institution relation for account settings', async () => {
    const institution = { id: 'institution-1', name: 'Example Institute', code: 'EX' };
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', Institution: institution });
    const service = new UsersService(prismaMock as never);

    await service.getProfile('user-1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({ Institution: true }),
    }));
  });
});
