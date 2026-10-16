import { Test, TestingModule } from '@nestjs/testing';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

const feedbackServiceMock = {
  create: vi.fn(),
  findAll: vi.fn(),
  updateStatus: vi.fn(),
};

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
};

const firebaseMock = {
  auth: {
    verifyIdToken: vi.fn(),
  },
};

describe('FeedbackController', () => {
  let controller: FeedbackController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        { provide: FeedbackService, useValue: feedbackServiceMock },
        { provide: PrismaService, useValue: prismaMock },
        { provide: FirebaseAdminService, useValue: firebaseMock },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates feedback creation to FeedbackService with user ID', async () => {
    const dto = { title: 'App bug', description: 'Crashing on login', category: 'BUG' as const };
    feedbackServiceMock.create.mockResolvedValue({ id: 'fb-1', ...dto, userId: 'user-1' });

    const result = await controller.create({ id: 'user-1' }, dto as any);

    expect(feedbackServiceMock.create).toHaveBeenCalledWith('user-1', dto);
    expect(result).toEqual(expect.objectContaining({ id: 'fb-1', userId: 'user-1' }));
  });

  it('delegates findAll to FeedbackService', async () => {
    feedbackServiceMock.findAll.mockResolvedValue([{ id: 'fb-1' }]);

    const result = await controller.findAll();

    expect(feedbackServiceMock.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('delegates updateStatus to FeedbackService', async () => {
    const updateDto = { status: 'RESOLVED' as const, adminNotes: 'Fixed in v1.1' };
    feedbackServiceMock.updateStatus.mockResolvedValue({ id: 'fb-1', ...updateDto });

    const result = await controller.updateStatus('fb-1', updateDto as any);

    expect(feedbackServiceMock.updateStatus).toHaveBeenCalledWith('fb-1', updateDto);
    expect(result).toEqual(expect.objectContaining({ status: 'RESOLVED' }));
  });
});
