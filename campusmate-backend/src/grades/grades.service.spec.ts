import { vi, describe, beforeEach, it, expect } from 'vitest';
import { GradesService } from './grades.service';
import { PrismaService } from '../common/prisma.service';
import { FirebaseAdminService } from '../common/firebase/firebase-admin.service';

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

const firestoreDocMock = {
  set: vi.fn().mockResolvedValue(undefined),
};

const firestoreCollectionMock = {
  where: vi.fn().mockReturnThis(),
  doc: vi.fn(() => firestoreDocMock),
  get: vi.fn(),
};

const firebaseMock = {
  firestore: {
    collection: vi.fn(() => firestoreCollectionMock),
  },
};

describe('GradesService', () => {
  let service: GradesService;

  beforeEach(() => {
    vi.resetAllMocks();
    firestoreCollectionMock.where.mockReturnThis();
    firestoreCollectionMock.get.mockResolvedValue({ empty: true, docs: [] });

    service = new GradesService(prismaMock as never, firebaseMock as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns records from Firestore if snapshot is not empty', async () => {
    firestoreCollectionMock.get.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          data: () => ({ id: 'rec-1', studentId: 'student-1', sgpa: 8.5 }),
        },
      ],
    });

    const result = await service.getMyRecords('student-1');

    expect(firebaseMock.firestore.collection).toHaveBeenCalledWith('academic_records');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: 'rec-1', sgpa: 8.5 }));
  });

  it('falls back to Prisma academicRecord.findMany when Firestore has no records', async () => {
    firestoreCollectionMock.get.mockResolvedValueOnce({ empty: true, docs: [] });
    prismaMock.academicRecord.findMany.mockResolvedValueOnce([
      { id: 'rec-prisma-1', studentId: 'student-1', sgpa: 9.0 },
    ]);

    const result = await service.getMyRecords('student-1');

    expect(prismaMock.academicRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: 'student-1' } }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: 'rec-prisma-1', sgpa: 9.0 }));
  });

  it('upserts academic record and recalculates SGPA accurately', async () => {
    const dto = {
      studentId: 'student-1',
      termId: 'term-1',
      grades: [
        { subjectId: 'sub-1', grade: 'O', gradePoint: 10, credits: 4 },
        { subjectId: 'sub-2', grade: 'E', gradePoint: 9, credits: 4 },
      ],
    };

    prismaMock.academicRecord.upsert.mockResolvedValue({
      id: 'rec-new',
      studentId: 'student-1',
      termId: 'term-1',
      sgpa: 9.5,
      totalCredits: 8,
    });
    prismaMock.grade.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.grade.createMany.mockResolvedValue({ count: 2 });
    prismaMock.academicRecord.findMany.mockResolvedValue([
      { id: 'rec-new', sgpa: 9.5, totalCredits: 8 },
    ]);
    prismaMock.academicRecord.findUnique.mockResolvedValue({
      id: 'rec-new',
      studentId: 'student-1',
      termId: 'term-1',
      sgpa: 9.5,
      totalCredits: 8,
      grades: [],
    });

    const result = await service.upsertAcademicRecord(dto as any);

    expect(prismaMock.academicRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sgpa: 9.5,
          totalCredits: 8,
        }),
      }),
    );
    expect(result).toBeDefined();
  });
});
