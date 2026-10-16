import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { RemindersService } from './reminders.service';

const firestoreDeleteMock = vi.fn().mockResolvedValue({});
const firestoreDocMock = vi.fn(() => ({
  delete: firestoreDeleteMock,
}));
const firestoreCollectionMock = vi.fn(() => ({
  doc: firestoreDocMock,
}));

const firebaseMock = {
  firestore: {
    collection: firestoreCollectionMock,
  },
};

const prismaMock = {
  reminder: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
};

describe('RemindersService.remove (IDOR Prevention)', () => {
  let service: RemindersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RemindersService(prismaMock as never, firebaseMock as never);
  });

  it('allows the authentic creator to delete their own reminder', async () => {
    const existingReminder = {
      id: 'rem-101',
      creatorId: 'user-alice',
      title: 'Submit Operating Systems Assignment',
      category: 'ASSIGNMENT',
      dueDate: new Date(),
    };

    prismaMock.reminder.findUnique.mockResolvedValue(existingReminder);
    prismaMock.reminder.delete.mockResolvedValue(existingReminder);

    const result = await service.remove('user-alice', 'rem-101');

    expect(prismaMock.reminder.findUnique).toHaveBeenCalledWith({
      where: { id: 'rem-101' },
    });
    expect(firestoreCollectionMock).toHaveBeenCalledWith('reminders');
    expect(firestoreDocMock).toHaveBeenCalledWith('rem-101');
    expect(firestoreDeleteMock).toHaveBeenCalled();
    expect(prismaMock.reminder.delete).toHaveBeenCalledWith({
      where: { id: 'rem-101' },
    });
    expect(result).toEqual(existingReminder);
  });

  it('throws ForbiddenException when a user attempts to delete another user reminder', async () => {
    const existingReminder = {
      id: 'rem-102',
      creatorId: 'user-bob',
      title: 'Midterm Exam Preparation',
      category: 'EXAM',
      dueDate: new Date(),
    };

    prismaMock.reminder.findUnique.mockResolvedValue(existingReminder);

    await expect(service.remove('user-attacker-charlie', 'rem-102')).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.remove('user-attacker-charlie', 'rem-102')).rejects.toThrow(
      'You do not have permission to delete this reminder',
    );

    expect(prismaMock.reminder.delete).not.toHaveBeenCalled();
    expect(firestoreDeleteMock).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the target reminder does not exist', async () => {
    prismaMock.reminder.findUnique.mockResolvedValue(null);

    await expect(service.remove('user-alice', 'non-existent-reminder-id')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.remove('user-alice', 'non-existent-reminder-id')).rejects.toThrow(
      'Reminder with ID non-existent-reminder-id not found',
    );

    expect(prismaMock.reminder.delete).not.toHaveBeenCalled();
    expect(firestoreDeleteMock).not.toHaveBeenCalled();
  });

  it('still completes Prisma deletion even if Firestore deletion throws an error', async () => {
    const existingReminder = {
      id: 'rem-103',
      creatorId: 'user-alice',
      title: 'Lab Submission',
    };

    prismaMock.reminder.findUnique.mockResolvedValue(existingReminder);
    prismaMock.reminder.delete.mockResolvedValue(existingReminder);
    firestoreDeleteMock.mockRejectedValueOnce(new Error('Firestore network timeout'));

    const result = await service.remove('user-alice', 'rem-103');

    expect(prismaMock.reminder.delete).toHaveBeenCalledWith({
      where: { id: 'rem-103' },
    });
    expect(result).toEqual(existingReminder);
  });
});

