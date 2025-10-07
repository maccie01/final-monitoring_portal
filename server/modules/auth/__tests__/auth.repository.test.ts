import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authRepository } from '../auth.repository';
import { getDb } from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  getDb: vi.fn(),
}));

describe('AuthRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findUserByUsernameOrEmail', () => {
    it('should find user by username', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$12$hashedpassword',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.findUserByUsernameOrEmail('testuser');

      expect(result).toEqual(mockUser);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should find user by email', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$12$hashedpassword',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.findUserByUsernameOrEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user not found', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.findUserByUsernameOrEmail('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('findUserByIdWithProfile', () => {
    it('should find user with profile', async () => {
      const mockResult = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        userProfile: {
          id: 1,
          name: 'Test Profile',
          startPage: '/dashboard',
          sidebar: {},
        },
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockResult]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.findUserByIdWithProfile('1');

      expect(result).toBeDefined();
      expect(result.userProfile).toBeDefined();
    });

    it('should return undefined when user not found', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.findUserByIdWithProfile('999');

      expect(result).toBeUndefined();
    });

    it('should set userProfile to null when no profile exists', async () => {
      const mockResult = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        userProfile: {
          id: null,
          name: null,
          startPage: null,
          sidebar: null,
        },
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockResult]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.findUserByIdWithProfile('1');

      expect(result.userProfile).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile by ID', async () => {
      const mockProfile = {
        id: 1,
        name: 'Test Profile',
        startPage: '/dashboard',
        sidebar: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockProfile]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.getUserProfile(1);

      expect(result).toEqual(mockProfile);
    });

    it('should return undefined when profile not found', async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      (getDb as any).mockReturnValue(mockDb);

      const result = await authRepository.getUserProfile(999);

      expect(result).toBeUndefined();
    });
  });
});
