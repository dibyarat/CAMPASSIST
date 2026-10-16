import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service';
import { Role } from '../common/enums';

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

const firestoreDocSet = vi.fn().mockResolvedValue({});
const firestoreDocGet = vi.fn().mockResolvedValue({ exists: false, data: () => null });
const firestoreDoc = vi.fn(() => ({
  set: firestoreDocSet,
  get: firestoreDocGet,
}));
const firestoreCollection = vi.fn(() => ({
  doc: firestoreDoc,
}));

const firebaseMock = {
  firestore: {
    collection: firestoreCollection,
  },
  auth: {
    getUser: vi.fn(),
    deleteUser: vi.fn(),
  },
};

const prismaMock = {
  user: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  institution: {
    findUnique: vi.fn(),
  },
  section: {
    findFirst: vi.fn(),
  },
  student: {
    upsert: vi.fn(),
  },
  profile: {
    upsert: vi.fn(),
  },
  $transaction: vi.fn((callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction)),
};

describe('UsersService.updateUserDetails', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new UsersService(prismaMock as never, firebaseMock as never);
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
        student: {
          include: {
            section: {
              include: {
                department: true,
                institution: true,
              },
            },
          },
        },
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

describe('UsersService.onboardUser', () => {
  let service: UsersService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new UsersService(prismaMock as never, firebaseMock as never);
    prismaMock.institution.findUnique.mockResolvedValue({ id: 'inst-1', name: 'Test College', code: 'TC' });
    prismaMock.section.findFirst.mockResolvedValue({
      id: 'sec-1',
      name: 'CS-A',
      department: { name: 'CS' },
      institution: { name: 'Test College' },
    });
    prismaMock.user.upsert.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.edu',
      role: Role.STUDENT,
      institutionId: 'inst-1',
    });
    prismaMock.student.upsert.mockResolvedValue({ id: 'student-1', userId: 'user-1', sectionId: 'sec-1' });
    prismaMock.profile.upsert.mockResolvedValue({ id: 'profile-1', fullName: 'Student One', rollNumber: 'CS01', section: 'CS-A' });
  });

  it('forces STUDENT role and prevents DEVELOPER privilege escalation', async () => {
    const result = await service.onboardUser(
      'user-attacker',
      'attacker@example.edu',
      'Attacker User',
      'DEVELOPER',
      'CS007',
      'CS-A',
      'TC',
    );

    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { id: 'user-attacker' },
      update: { email: 'attacker@example.edu', role: Role.STUDENT, institutionId: 'inst-1' },
      create: { id: 'user-attacker', email: 'attacker@example.edu', role: Role.STUDENT, institutionId: 'inst-1' },
    });
    expect(firestoreCollection).toHaveBeenCalledWith('users');
    expect(firestoreDoc).toHaveBeenCalledWith('user-attacker');
    expect(firestoreDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-attacker',
        email: 'attacker@example.edu',
        role: Role.STUDENT,
      }),
      { merge: true },
    );
    expect(result.user.role).toBe(Role.STUDENT);
  });

  it('forces STUDENT role and prevents CR privilege escalation', async () => {
    await service.onboardUser(
      'user-cr-escalation',
      'cr@example.edu',
      'Fake CR',
      'CR',
      'CS008',
      'CS-A',
      'TC',
    );

    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { id: 'user-cr-escalation' },
      update: { email: 'cr@example.edu', role: Role.STUDENT, institutionId: 'inst-1' },
      create: { id: 'user-cr-escalation', email: 'cr@example.edu', role: Role.STUDENT, institutionId: 'inst-1' },
    });
    expect(firestoreDocSet).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-cr-escalation',
        role: Role.STUDENT,
      }),
      { merge: true },
    );
  });

  it('successfully onboards legitimate student with STUDENT role', async () => {
    const result = await service.onboardUser(
      'user-legit',
      'legit@example.edu',
      'Legit Student',
      Role.STUDENT,
      'CS009',
      'CS-A',
      'TC',
    );

    expect(prismaMock.user.upsert).toHaveBeenCalledWith({
      where: { id: 'user-legit' },
      update: { email: 'legit@example.edu', role: Role.STUDENT, institutionId: 'inst-1' },
      create: { id: 'user-legit', email: 'legit@example.edu', role: Role.STUDENT, institutionId: 'inst-1' },
    });
    expect(result.user).toBeDefined();
    expect(result.profile).toBeDefined();
  });
});