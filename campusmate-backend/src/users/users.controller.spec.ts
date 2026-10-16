import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { Role } from '../common/enums';

describe('UsersController.onboardUser', () => {
  let controller: UsersController;
  const usersServiceMock = {
    onboardUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new UsersController(usersServiceMock as never);
  });

  it('forces Role.STUDENT when client sends DEVELOPER in request body', async () => {
    usersServiceMock.onboardUser.mockResolvedValue({ id: 'user-1', role: Role.STUDENT });

    const req = { user: { id: 'user-1' } };
    const body = {
      email: 'hacker@college.edu',
      fullName: 'Aspiring Admin',
      role: 'DEVELOPER',
      rollNumber: 'CS100',
      section: 'CS-A',
      institutionCode: 'TC',
    };

    await controller.onboardUser(req, body);

    expect(usersServiceMock.onboardUser).toHaveBeenCalledWith(
      'user-1',
      'hacker@college.edu',
      'Aspiring Admin',
      Role.STUDENT,
      'CS100',
      'CS-A',
      'TC',
    );
  });

  it('forces Role.STUDENT when client sends CR in request body', async () => {
    usersServiceMock.onboardUser.mockResolvedValue({ id: 'user-2', role: Role.STUDENT });

    const req = { user: { id: 'user-2' } };
    const body = {
      email: 'cr-wannabe@college.edu',
      fullName: 'Wannabe CR',
      role: 'CR',
      rollNumber: 'CS101',
      section: 'CS-B',
    };

    await controller.onboardUser(req, body);

    expect(usersServiceMock.onboardUser).toHaveBeenCalledWith(
      'user-2',
      'cr-wannabe@college.edu',
      'Wannabe CR',
      Role.STUDENT,
      'CS101',
      'CS-B',
      undefined,
    );
  });

  it('throws UnauthorizedException when user context is missing from request', () => {
    const req = { user: null };
    const body = {
      email: 'test@college.edu',
      fullName: 'Test User',
      role: 'STUDENT',
    };

    expect(() => controller.onboardUser(req, body)).toThrow(UnauthorizedException);
    expect(usersServiceMock.onboardUser).not.toHaveBeenCalled();
  });
});

