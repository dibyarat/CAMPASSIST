import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionsService } from './sections.service';

const prismaMock = {
  department: { findFirst: vi.fn(), create: vi.fn() },
  semester: { findFirst: vi.fn(), create: vi.fn() },
  section: { create: vi.fn() },
};

const firestoreDocMock = {
  set: vi.fn().mockResolvedValue(undefined),
};

const firebaseMock = {
  firestore: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => firestoreDocMock),
    })),
  },
};

describe('SectionsService.create', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.department.findFirst.mockResolvedValue({ id: 'department-1', name: 'Computer Science', code: 'CS' });
    prismaMock.semester.findFirst.mockResolvedValue({ id: 'semester-1', name: 'Semester 1', number: 1 });
    prismaMock.section.create.mockResolvedValue({
      id: 'section-1',
      name: 'CS-A',
      departmentId: 'department-1',
      semesterId: 'semester-1',
      institutionId: 'institution-1',
    });
  });

  it('persists the selected institution on the new section with relation metadata', async () => {
    const service = new SectionsService(prismaMock as never, firebaseMock as never);
    await service.create({
      name: 'CS-A',
      departmentCode: 'CS',
      departmentName: 'Computer Science',
      semesterNumber: 1,
      semesterName: 'Semester 1',
      institutionId: 'institution-1',
    });

    expect(prismaMock.section.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'CS-A',
          departmentId: 'department-1',
          semesterId: 'semester-1',
          institutionId: 'institution-1',
        }),
        include: { department: true, semester: true, institution: true },
      }),
    );
    expect(firebaseMock.firestore.collection).toHaveBeenCalledWith('sections');
    expect(firestoreDocMock.set).toHaveBeenCalled();
  });

  it('creates new department and semester if they do not exist', async () => {
    prismaMock.department.findFirst.mockResolvedValue(null);
    prismaMock.department.create.mockResolvedValue({ id: 'dept-new', name: 'Information Technology', code: 'IT' });
    prismaMock.semester.findFirst.mockResolvedValue(null);
    prismaMock.semester.create.mockResolvedValue({ id: 'sem-new', name: 'Semester 2', number: 2 });

    const service = new SectionsService(prismaMock as never, firebaseMock as never);
    await service.create({
      name: 'IT-B',
      departmentCode: 'IT',
      departmentName: 'Information Technology',
      semesterNumber: 2,
      semesterName: 'Semester 2',
      institutionId: 'institution-1',
    });

    expect(prismaMock.department.create).toHaveBeenCalledWith({
      data: { name: 'Information Technology', code: 'IT' },
    });
    expect(prismaMock.semester.create).toHaveBeenCalledWith({
      data: { name: 'Semester 2', number: 2 },
    });
  });
});
