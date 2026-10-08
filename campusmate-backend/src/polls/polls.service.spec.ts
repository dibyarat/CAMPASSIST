import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PollsService } from './polls.service';

const prismaMock = {
  poll: {
    findMany: vi.fn(),
  },
};

describe('PollsService.getActivePolls', () => {
  let service: PollsService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new PollsService(prismaMock as never);
  });

  it('returns the authenticated user vote state without exposing vote rows', async () => {
    prismaMock.poll.findMany.mockResolvedValue([
      { id: 'poll-1', options: [], votes: [{ id: 'vote-1' }] },
      { id: 'poll-2', options: [], votes: [] },
    ]);

    const polls = await service.getActivePolls('user-1');

    expect(prismaMock.poll.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'ACTIVE' },
      include: expect.objectContaining({
        votes: { where: { userId: 'user-1' }, select: { id: true } },
      }),
    }));
    expect(polls).toEqual([
      { id: 'poll-1', options: [], hasVoted: true },
      { id: 'poll-2', options: [], hasVoted: false },
    ]);
  });
});