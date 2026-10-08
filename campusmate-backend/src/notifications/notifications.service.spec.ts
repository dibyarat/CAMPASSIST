import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsService } from './notifications.service';

const prismaMock = {
  user: { findUnique: vi.fn() },
  student: { findMany: vi.fn() },
  notification: { createMany: vi.fn() },
};

describe('NotificationsService.createAnnouncement', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('delivers the announcement to section students and the CR', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'cr-1',
      crAssignment: { sectionId: 'section-1', isActive: true },
    });
    prismaMock.student.findMany.mockResolvedValue([
      { userId: 'student-1' },
      { userId: 'student-2' },
    ]);
    prismaMock.notification.createMany.mockResolvedValue({ count: 3 });

    const service = new NotificationsService(prismaMock as never);
    const result = await service.createAnnouncement('cr-1', 'Test announcement', 'Message');

    expect(result).toEqual({ success: true });
    expect(prismaMock.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ recipientId: 'student-1', title: 'Test announcement', message: 'Message' }),
        expect.objectContaining({ recipientId: 'student-2', title: 'Test announcement', message: 'Message' }),
        expect.objectContaining({ recipientId: 'cr-1', title: 'Test announcement', message: 'Message' }),
      ],
    });
  });
});
