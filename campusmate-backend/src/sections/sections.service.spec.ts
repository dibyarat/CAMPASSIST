import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionsService } from './sections.service';

const prismaMock = {
  department: { findFirst: vi.fn(), create: vi.fn() },
  semester: { findFirst: vi.fn(), create: vi.fn() },
  section: { create: vi.fn() },
};

describe('SectionsService.create', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prismaMock.department.findFirst.mockResolvedValue({ id: 'department-1' });
    prismaMock.semester.findFirst.mockResolvedValue({ id: 'semester-1' });
    prismaMock.section.create.mockResolvedValue({ id: 'section-1' });
  });

  it('persists the selected institution on the new section', async () => {
    const service = new SectionsService(prismaMock as never);
    await service.create({
      name: 'CS-A',
      departmentCode: 'CS',
      departmentName: 'Computer Science',
      semesterNumber: 1,
      semesterName: 'Semester 1',
      institutionId: 'institution-1',
    });

    expect(prismaMock.section.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ institutionId: 'institution-1' }),
    });
  });
});
