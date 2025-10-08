import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usersRepository } from '../users.repository';
import type { User, UserProfile, Mandant } from '@shared/schema';

// Mock database
vi.mock('../../../db', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ rows: [{ next_id: 100 }] }),
  })),
}));

vi.mock('../../../connection-pool', () => ({
  ConnectionPoolManager: {
    getInstance: vi.fn(() => ({
      getPool: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue({ rows: [] }),
      }),
    })),
  },
}));

describe('UsersRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user with profile when found', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        role: 'user',
        mandantId: 1,
        userProfile: {
          id: 1,
          name: 'Test Profile',
          startPage: '/dashboard',
          sidebar: {},
        },
      };

      const { getDb } = await import('../../../db');
      vi.mocked(getDb).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      } as any);

      const result = await usersRepository.getUserById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.username).toBe('testuser');
    });

    it('should return undefined when user not found', async () => {
      const { getDb } = await import('../../../db');
      vi.mocked(getDb).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await usersRepository.getUserById('999');

      expect(result).toBeUndefined();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users with profiles', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', userProfile: { id: 1, name: 'Profile1' } },
        { id: '2', username: 'user2', userProfile: { id: 2, name: 'Profile2' } },
      ];

      const { getDb } = await import('../../../db');
      vi.mocked(getDb).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockUsers),
      } as any);

      const result = await usersRepository.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('user1');
      expect(result[1].username).toBe('user2');
    });
  });

  describe('getUsersByMandant', () => {
    it('should return users filtered by mandant', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', mandantId: 5 },
      ];

      const { getDb } = await import('../../../db');
      vi.mocked(getDb).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue(mockUsers),
      } as any);

      const result = await usersRepository.getUsersByMandant(5);

      expect(result).toHaveLength(1);
      expect(result[0].mandantId).toBe(5);
    });
  });

  describe('updateUser', () => {
    it('should update user and return updated data', async () => {
      const mockUpdatedUser = {
        id: '1',
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const { getDb } = await import('../../../db');
      vi.mocked(getDb).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([mockUpdatedUser]),
      } as any);

      const result = await usersRepository.updateUser('1', { username: 'updateduser' });

      expect(result.username).toBe('updateduser');
    });
  });

  describe('User Profiles', () => {
    it('should get all user profiles', async () => {
      const mockProfiles = [
        { id: 1, name: 'Profile1', startPage: '/dashboard' },
        { id: 2, name: 'Profile2', startPage: '/maps' },
      ];

      const { ConnectionPoolManager } = await import('../../../connection-pool');
      const getInstance = vi.mocked(ConnectionPoolManager.getInstance);
      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: mockProfiles.map(p => ({
          id: p.id,
          name: p.name,
          start_page: p.startPage,
          sidebar: {},
          created_at: new Date(),
          updated_at: new Date(),
        })) }),
      };
      getInstance.mockReturnValue({ getPool: vi.fn().mockResolvedValue(mockPool) } as any);

      const result = await usersRepository.getAllUserProfiles();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Profile1');
    });
  });

  describe('Mandants', () => {
    it('should get all mandants', async () => {
      const mockMandants = [
        { id: 1, name: 'Mandant1', description: 'Test', category: 'A', info: {}, created_at: new Date() },
      ];

      const { ConnectionPoolManager } = await import('../../../connection-pool');
      const getInstance = vi.mocked(ConnectionPoolManager.getInstance);
      const mockPool = {
        query: vi.fn().mockResolvedValue({ rows: mockMandants }),
      };
      getInstance.mockReturnValue({ getPool: vi.fn().mockResolvedValue(mockPool) } as any);

      const result = await usersRepository.getAllMandants();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mandant1');
    });
  });
});
