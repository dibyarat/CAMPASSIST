import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { GradesService } from './grades.service';
import { PrismaService } from '../common/prisma.service';

const prismaMock = {
  academicRecord: {
    findMany: vi.fn(),
    upsert: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  grade: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
};

describe('GradesService', () => {
  let service: GradesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
