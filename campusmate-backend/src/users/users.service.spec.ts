import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service';

describe('UsersService - getClassRepresentatives (CR Directory Data Sanitization & Scoping)', () => {
  let service: UsersService;
  let mockPrisma: any;
  let mockFirebase: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    };

    mockFirebase = {
      firestore: {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn(),
            set: vi.fn(),
            delete: vi.fn(),
          }),
          get: vi.fn(),
        }),
      },
    };

    service = new UsersService(mockPrisma as any, mockFirebase as any);
  });

  it('should scope CR query to requesting student institution and sanitize sensitive profile fields', async () => {
    const studentUser = {
      id: 'student-123',
      role: 'STUDENT',
      institutionId: 'inst-kiit',
    };

    const mockDbCrs = [
      {
        id: 'cr-1',
        email: 'cr.cse@kiit.ac.in',
        role: 'CR',
        institutionId: 'inst-kiit',
        profile: {
          fullName: 'Aarav Sharma',
          section: 'CSE-1',
          department: 'Computer Science',
        },
        crAssignment: [
          {
            isActive: true,
            section: {
              id: 'sec-1',
              name: 'CSE-1',
              department: { id: 'dept-1', name: 'Computer Science', code: 'CSE' },
            },
          },
        ],
        Institution: {
          id: 'inst-kiit',
          name: 'KIIT University',
          code: 'KIIT',
        },
      },
    ];

    mockPrisma.user.findMany.mockResolvedValue(mockDbCrs);

    const result = await service.getClassRepresentatives(studentUser);

    // Verify query scoping
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'CR',
          institutionId: 'inst-kiit',
        }),
      })
    );

    // Verify sanitized result format
    expect(result).toHaveLength(1);
    const cr = result[0];
    expect(cr.profile.fullName).toBe('Aarav Sharma');
    expect(cr.email).toBe('cr.cse@kiit.ac.in');
    expect(cr.profile.section).toBe('CSE-1');
    expect(cr.profile.department).toBe('Computer Science');

    // Strict security check: sensitive profile identifiers must NOT exist
    expect((cr as any).rollNumber).toBeUndefined();
    expect((cr as any).studentId).toBeUndefined();
    expect((cr as any).hostelName).toBeUndefined();
    expect((cr as any).hostelBlock).toBeUndefined();
    expect((cr as any).hostelRoom).toBeUndefined();
    expect((cr.profile as any)?.rollNumber).toBeUndefined();
    expect((cr.profile as any)?.studentId).toBeUndefined();
    expect((cr.profile as any)?.hostelName).toBeUndefined();
    expect((cr.profile as any)?.hostelBlock).toBeUndefined();
    expect((cr.profile as any)?.hostelRoom).toBeUndefined();
  });

  it('should allow developers global institution scope without restricting institutionId in query', async () => {
    const devUser = {
      id: 'dev-admin',
      role: 'DEVELOPER',
      institutionId: 'inst-kiit',
    };

    mockPrisma.user.findMany.mockResolvedValue([]);

    await service.getClassRepresentatives(devUser);

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: 'CR',
        },
      })
    );
  });

  it('should resolve caller institution from database if not populated in caller session', async () => {
    const studentWithoutCachedInst = {
      id: 'student-no-inst',
      role: 'STUDENT',
      institutionId: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue({
      institutionId: 'inst-resolved-from-db',
    });
    mockPrisma.user.findMany.mockResolvedValue([]);

    await service.getClassRepresentatives(studentWithoutCachedInst);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'student-no-inst' },
      select: { institutionId: true },
    });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'CR',
          institutionId: 'inst-resolved-from-db',
        }),
      })
    );
  });
});
