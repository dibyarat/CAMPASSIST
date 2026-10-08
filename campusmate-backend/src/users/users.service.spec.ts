import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';

const transaction = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  section: {
    findUnique: vi.fn(),
  },
  institution: {
    findUnique: vi.fn(),
  },
  student: {
    upsert: vi.fn(),
  },
  profile: {
    upsert: vi.fn(),
  },
};

const prismaMock = {
  user: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn((callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction)),
};

describe('UsersService.updateUserDetails', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new UsersService(prismaMock as never);
    prismaMock.user.findMany.mockResolvedValue([]);
    transaction.user.findUnique.mockResolvedValue({ id: 'user-1' });
    transaction.user.update.mockResolvedValue({ id: 'user-1', email: 'student@example.edu' });
    transaction.section.findUnique.mockResolvedValue({ id: 'section-1', name: 'CS-A' });
    transaction.student.upsert.mockResolvedValue({ id: 'student-1', sectionId: 'section-1' });
    transaction.profile.upsert.mockResolvedValue({ id: 'profile-1', fullName: 'Rohit Das' });
  });

  it('includes assigned sections in the developer user list', async () => {
    await service.getAllUsers();

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({
        student: { include: { section: true } },
      }),
    }));
  });

  it('creates missing student details and synchronizes the selected section name', async () => {
    await service.updateUserDetails('user-1', {
      fullName: 'Rohit Das',
      rollNumber: 'CS101',
      sectionId: 'section-1',
    });

    expect(transaction.student.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: { sectionId: 'section-1' },
      create: { userId: 'user-1', sectionId: 'section-1' },
    });
    expect(transaction.profile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
      create: expect.objectContaining({
        userId: 'user-1',
        studentId: 'student-1',
        fullName: 'Rohit Das',
        rollNumber: 'CS101',
        section: 'CS-A',
      }),
    }));
  });

  it('rejects an invalid section before creating profile data', async () => {
    transaction.section.findUnique.mockResolvedValue(null);

    await expect(service.updateUserDetails('user-1', {
      fullName: 'Rohit Das',
      sectionId: 'missing-section',
    })).rejects.toThrow('Section not found');

    expect(transaction.student.upsert).not.toHaveBeenCalled();
    expect(transaction.profile.upsert).not.toHaveBeenCalled();
  });
});