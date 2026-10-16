import { vi, describe, beforeEach, it, expect } from 'vitest';
import { FeedbackService } from './feedback.service';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
  feedback: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const firestoreDocMock = {
  id: 'doc-1',
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
};

const queryMock = {
  get: vi.fn(),
};

const firestoreCollectionMock = {
  doc: vi.fn(() => firestoreDocMock),
  orderBy: vi.fn(() => queryMock),
  get: vi.fn(),
};

const firebaseMock = {
  firestore: {
    collection: vi.fn(() => firestoreCollectionMock),
  },
};

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    vi.resetAllMocks();
    firestoreDocMock.id = 'doc-1';
    firestoreDocMock.get.mockResolvedValue({ exists: false, data: () => ({}) });
    queryMock.get.mockResolvedValue({ empty: true, docs: [] });
    firestoreCollectionMock.get.mockResolvedValue({ empty: true, docs: [] });
    prismaMock.feedback.findMany.mockResolvedValue([]);

    service = new FeedbackService(prismaMock as never, firebaseMock as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates feedback document in Firestore', async () => {
    firestoreDocMock.get.mockResolvedValueOnce({
      exists: true,
      data: () => ({ email: 'test@campus.edu', fullName: 'Test User' }),
    });

    const result = await service.create('user-1', {
      title: 'App Feedback',
      description: 'Needs dark mode',
      category: 'FEATURE_REQUEST' as any,
    });

    expect(firebaseMock.firestore.collection).toHaveBeenCalledWith('feedbacks');
    expect(firestoreDocMock.set).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      userId: 'user-1',
      title: 'App Feedback',
      userEmail: 'test@campus.edu',
      userName: 'Test User',
      status: 'PENDING',
    }));
  });

  it('falls back to Prisma when Firestore write fails', async () => {
    firestoreDocMock.set.mockRejectedValueOnce(new Error('Firestore offline'));
    prismaMock.feedback.create.mockResolvedValueOnce({
      id: 'fb-prisma-1',
      userId: 'user-1',
      title: 'Fallback feedback',
      status: 'PENDING',
    });

    const result = await service.create('user-1', {
      title: 'Fallback feedback',
      description: 'Prisma fallback check',
      category: 'GENERAL' as any,
    });

    expect(prismaMock.feedback.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        title: 'Fallback feedback',
      }),
    });
    expect(result).toEqual(expect.objectContaining({ id: 'fb-prisma-1' }));
  });

  it('reads feedbacks from Firestore when available', async () => {
    queryMock.get.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: 'fb-1',
          data: () => ({
            title: 'Great app',
            userEmail: 'user@test.edu',
            userName: 'Happy Student',
          }),
        },
      ],
    });

    const results = await service.findAll();

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(expect.objectContaining({
      id: 'fb-1',
      title: 'Great app',
      user: expect.objectContaining({ email: 'user@test.edu' }),
    }));
  });

  it('resolves/deletes feedback document on RESOLVED status', async () => {
    firestoreDocMock.get.mockResolvedValueOnce({ exists: true, data: () => ({ status: 'PENDING' }) });

    const result = await service.updateStatus('fb-1', { status: 'RESOLVED' as any });

    expect(firestoreDocMock.delete).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true, id: 'fb-1' });
  });
});
