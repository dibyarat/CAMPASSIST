import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('CampusAssist Account Deletion & Auth Security Suite', () => {
  let controller: UsersController;
  let service: UsersService;
  let mockPrisma: any;
  let mockFirebase: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        delete: vi.fn().mockResolvedValue({ id: 'test-user-1' }),
        findUnique: vi.fn(),
      },
      profile: {
        upsert: vi.fn(),
      },
    };

    mockFirebase = {
      firestore: {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            delete: vi.fn().mockResolvedValue(true),
            get: vi.fn().mockResolvedValue({ exists: false }),
            set: vi.fn().mockResolvedValue(true),
          }),
        }),
      },
      auth: {
        deleteUser: vi.fn().mockResolvedValue(undefined),
      },
    };

    service = new UsersService(mockPrisma as any, mockFirebase as any);
    controller = new UsersController(service);
  });

  describe('UsersController — deleteMyAccount', () => {
    it('1. Rejects request without authenticated user (throws UnauthorizedException)', () => {
      const req = { user: undefined };
      expect(() =>
        controller.deleteMyAccount(req, { confirmation: 'DELETE_MY_ACCOUNT' })
      ).toThrow(UnauthorizedException);
    });

    it('2. Rejects request without confirmation payload (throws BadRequestException)', () => {
      const req = { user: { id: 'test-user-1' } };
      expect(() =>
        controller.deleteMyAccount(req, { confirmation: 'wrong' })
      ).toThrow(BadRequestException);

      expect(() =>
        controller.deleteMyAccount(req, {} as any)
      ).toThrow(BadRequestException);
    });

    it('3. Successfully invokes deleteSelfAccount with authenticated user ID and valid confirmation', async () => {
      const spy = vi.spyOn(service, 'deleteSelfAccount').mockResolvedValue({
        success: true,
        userId: 'test-user-1',
        steps: {
          firebaseAuth: 'deleted',
          firestore: 'deleted',
          database: 'deleted',
        },
        errors: [],
      });

      const req = { user: { id: 'test-user-1' } };
      const res = await controller.deleteMyAccount(req, { confirmation: 'DELETE_MY_ACCOUNT' });

      expect(spy).toHaveBeenCalledWith('test-user-1');
      expect(res.success).toBe(true);
      expect(res.userId).toBe('test-user-1');
      expect(res.steps.database).toBe('deleted');
    });

    it('4. getProfile throws UnauthorizedException if user ID is missing (no mock-user-id fallback)', () => {
      const req = { user: undefined };
      expect(() => controller.getProfile(req)).toThrow(UnauthorizedException);
    });

    it('5. updateProfile throws UnauthorizedException if user ID is missing (no mock-user-id fallback)', () => {
      const req = { user: undefined };
      expect(() => controller.updateProfile(req, {})).toThrow(UnauthorizedException);
    });
  });

  describe('UsersService — deleteSelfAccount', () => {
    it('6. Full deletion flow deletes from Firestore, PostgreSQL, and Firebase Auth', async () => {
      const res = await service.deleteSelfAccount('test-user-1');

      expect(mockFirebase.firestore.collection).toHaveBeenCalledWith('users');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'test-user-1' } });
      expect(mockFirebase.auth.deleteUser).toHaveBeenCalledWith('test-user-1');

      expect(res.success).toBe(true);
      expect(res.steps.firestore).toBe('deleted');
      expect(res.steps.database).toBe('deleted');
      expect(res.steps.firebaseAuth).toBe('deleted');
      expect(res.errors).toHaveLength(0);
    });

    it('7. Partial failure: observable status reported when Firebase Auth user does not exist', async () => {
      const notFoundErr = new Error('User not found');
      (notFoundErr as any).code = 'auth/user-not-found';
      mockFirebase.auth.deleteUser.mockRejectedValue(notFoundErr);

      const res = await service.deleteSelfAccount('test-user-1');

      expect(res.success).toBe(true); // DB and Firestore succeeded
      expect(res.steps.database).toBe('deleted');
      expect(res.steps.firestore).toBe('deleted');
      expect(res.steps.firebaseAuth).toBe('not_found');
    });

    it('8. Partial failure: observable status and error recorded when Database deletion fails', async () => {
      mockPrisma.user.delete.mockRejectedValue(new Error('Foreign key violation'));

      const res = await service.deleteSelfAccount('test-user-1');

      expect(res.steps.database).toBe('failed');
      expect(res.errors.some((e: string) => e.includes('Database deletion'))).toBe(true);
    });
  });
});

