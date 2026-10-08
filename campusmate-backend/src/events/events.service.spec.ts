import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsService } from './events.service';

const prismaMock = {
  campusEvent: {
    findMany: vi.fn(),
    delete: vi.fn(),
  },
};

describe('EventsService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns completed events to developers', async () => {
    const completedEvent = { id: 'event-1', endDate: new Date('2024-01-01') };
    prismaMock.campusEvent.findMany.mockResolvedValue([completedEvent]);
    const service = new EventsService(prismaMock as never);

    await service.list(true);

    expect(prismaMock.campusEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('deletes any event by id regardless of status', async () => {
    prismaMock.campusEvent.delete.mockResolvedValue({ id: 'event-1' });
    const service = new EventsService(prismaMock as never);

    await service.remove('event-1');

    expect(prismaMock.campusEvent.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } });
  });
});
