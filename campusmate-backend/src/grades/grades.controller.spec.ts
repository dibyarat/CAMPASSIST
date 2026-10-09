import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PrismaService } from '../common/prisma.service';

const gradesServiceMock = {
  getMyRecords: vi.fn(),
  upsertAcademicRecord: vi.fn(),
};

describe('GradesController', () => {
  let controller: GradesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradesController],
      providers: [
        { provide: GradesService, useValue: gradesServiceMock },
        { provide: PrismaService, useValue: { user: { findUnique: vi.fn() } } },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: vi.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<GradesController>(GradesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
