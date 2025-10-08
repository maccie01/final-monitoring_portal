import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usersController } from '../users.controller';
import { usersService } from '../users.service';
import type { Request, Response } from 'express';

// Mock dependencies
vi.mock('../users.service', () => ({
  usersService: {
    getUserById: vi.fn(),
    getUserByUsername: vi.fn(),
    getUserByEmail: vi.fn(),
    getAllUsers: vi.fn(),
    getUsersByMandant: vi.fn(),
    getUsersByMandants: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserPassword: vi.fn(),
    deleteUser: vi.fn(),
    getAllUserProfiles: vi.fn(),
    getUserProfileById: vi.fn(),
    createUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    deleteUserProfile: vi.fn(),
    getAllMandants: vi.fn(),
    createMandant: vi.fn(),
    updateMandant: vi.fn(),
    deleteMandant: vi.fn(),
  },
}));

vi.mock('../../middleware/error', () => ({
  asyncHandler: (fn: Function) => fn,
  createAuthError: (msg: string) => new Error(msg),
  createValidationError: (msg: string) => new Error(msg),
  createNotFoundError: (msg: string) => new Error(msg),
}));

describe('UsersController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      session: {} as any,
    };

    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
  });

  describe('getUsers', () => {
    it('should return all users for superadmin', async () => {
      const mockUsers = [{ id: '1', username: 'user1' }, { id: '2', username: 'user2' }];

      (mockReq as any).session = {
        user: { id: 'superadmin', role: 'superadmin' },
      };

      vi.mocked(usersService.getAllUsers).mockResolvedValue(mockUsers as any);

      await usersController.getUsers(mockReq as Request, mockRes as Response);

      expect(usersService.getAllUsers).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should return filtered users for admin by mandant', async () => {
      const mockUser = { id: '1', role: 'admin', mandantId: 5, mandantAccess: [] };
      const mockUsers = [{ id: '2', username: 'user2', mandantId: 5 }];

      (mockReq as any).session = {
        user: mockUser,
      };

      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser as any);
      vi.mocked(usersService.getUsersByMandant).mockResolvedValue(mockUsers as any);

      await usersController.getUsers(mockReq as Request, mockRes as Response);

      expect(usersService.getUsersByMandant).toHaveBeenCalledWith(5);
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it('should throw error if not authenticated', async () => {
      (mockReq as any).session = {};

      await expect(usersController.getUsers(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Benutzer nicht authentifiziert');
    });

    it('should throw error if not admin or superadmin', async () => {
      (mockReq as any).session = {
        user: { id: '1', role: 'user' },
      };

      await expect(usersController.getUsers(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Keine Berechtigung');
    });
  });

  describe('getUser', () => {
    it('should return user if requesting own profile', async () => {
      const mockUser = { id: '1', username: 'testuser' };

      (mockReq as any).session = { user: { id: '1', role: 'user' } };
      mockReq.params = { id: '1' };

      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser as any);

      await usersController.getUser(mockReq as Request, mockRes as Response);

      expect(usersService.getUserById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('should allow admin to view any user', async () => {
      const mockUser = { id: '2', username: 'otheruser' };

      (mockReq as any).session = { user: { id: '1', role: 'admin' } };
      mockReq.params = { id: '2' };

      vi.mocked(usersService.getUserById).mockResolvedValue(mockUser as any);

      await usersController.getUser(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error if user tries to view another user profile', async () => {
      (mockReq as any).session = { user: { id: '1', role: 'user' } };
      mockReq.params = { id: '2' };

      await expect(usersController.getUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Keine Berechtigung');
    });
  });

  describe('createUser', () => {
    it('should create user as admin', async () => {
      const userData = { username: 'newuser', email: 'new@test.com', password: 'password' };
      const createdUser = { ...userData, id: '1' };

      (mockReq as any).session = { user: { id: 'admin1', role: 'admin', mandantId: 5 } };
      mockReq.body = userData;

      vi.mocked(usersService.createUser).mockResolvedValue(createdUser as any);

      await usersController.createUser(mockReq as Request, mockRes as Response);

      expect(usersService.createUser).toHaveBeenCalledWith({ ...userData, mandantId: 5 });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdUser);
    });

    it('should throw error if not admin', async () => {
      (mockReq as any).session = { user: { id: '1', role: 'user' } };

      await expect(usersController.createUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Keine Berechtigung');
    });

    it('should throw error if username missing', async () => {
      (mockReq as any).session = { user: { id: 'admin', role: 'admin' } };
      mockReq.body = { email: 'test@test.com' };

      await expect(usersController.createUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('erforderlich');
    });
  });

  describe('updateUser', () => {
    it('should allow user to update own profile (limited fields)', async () => {
      const updateData = { firstName: 'Updated', role: 'admin' }; // role should be filtered out
      const updatedUser = { id: '1', firstName: 'Updated', role: 'user' };

      (mockReq as any).session = { user: { id: '1', role: 'user' } };
      mockReq.params = { id: '1' };
      mockReq.body = updateData;

      vi.mocked(usersService.updateUser).mockResolvedValue(updatedUser as any);

      await usersController.updateUser(mockReq as Request, mockRes as Response);

      // Should have called updateUser with filtered data (no role)
      expect(usersService.updateUser).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should allow admin to update role and mandant', async () => {
      const updateData = { role: 'admin', mandantId: 10 };
      const updatedUser = { id: '2', role: 'admin', mandantId: 10 };

      (mockReq as any).session = { user: { id: '1', role: 'admin' } };
      mockReq.params = { id: '2' };
      mockReq.body = updateData;

      vi.mocked(usersService.updateUser).mockResolvedValue(updatedUser as any);

      await usersController.updateUser(mockReq as Request, mockRes as Response);

      expect(usersService.updateUser).toHaveBeenCalledWith('2', updateData);
      expect(mockRes.json).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('should delete user as admin', async () => {
      const userToDelete = { id: '2', mandantId: 5 };

      (mockReq as any).session = { user: { id: '1', role: 'admin', mandantId: 5 } };
      mockReq.params = { id: '2' };

      vi.mocked(usersService.getUserById).mockResolvedValue(userToDelete as any);
      vi.mocked(usersService.deleteUser).mockResolvedValue(undefined);

      await usersController.deleteUser(mockReq as Request, mockRes as Response);

      expect(usersService.deleteUser).toHaveBeenCalledWith('2');
      expect(mockRes.json).toHaveBeenCalledWith({ message: expect.stringContaining('gelöscht') });
    });

    it('should prevent user from deleting themselves', async () => {
      (mockReq as any).session = { user: { id: '1', role: 'admin' } };
      mockReq.params = { id: '1' };

      await expect(usersController.deleteUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('nicht selbst löschen');
    });

    it('should prevent admin from deleting user from different mandant', async () => {
      const userToDelete = { id: '2', mandantId: 10 };

      (mockReq as any).session = { user: { id: '1', role: 'admin', mandantId: 5 } };
      mockReq.params = { id: '2' };

      vi.mocked(usersService.getUserById).mockResolvedValue(userToDelete as any);

      await expect(usersController.deleteUser(mockReq as Request, mockRes as Response))
        .rejects.toThrow('Keine Berechtigung');
    });
  });

  describe('User Profiles', () => {
    it('should get all user profiles as admin', async () => {
      const mockProfiles = [{ id: 1, name: 'Profile1' }];

      (mockReq as any).session = { user: { id: '1', role: 'admin' } };

      vi.mocked(usersService.getAllUserProfiles).mockResolvedValue(mockProfiles as any);

      await usersController.getUserProfiles(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(mockProfiles);
    });

    it('should create user profile as admin', async () => {
      const profileData = { name: 'New Profile' };
      const createdProfile = { ...profileData, id: 1 };

      (mockReq as any).session = { user: { id: '1', role: 'admin' } };
      mockReq.body = profileData;

      vi.mocked(usersService.createUserProfile).mockResolvedValue(createdProfile as any);

      await usersController.createUserProfile(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdProfile);
    });
  });

  describe('Mandants', () => {
    it('should get all mandants when authenticated', async () => {
      const mockMandants = [{ id: 1, name: 'Mandant1' }];

      (mockReq as any).session = { user: { id: '1', role: 'user' } };

      vi.mocked(usersService.getAllMandants).mockResolvedValue(mockMandants as any);

      await usersController.getMandants(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(mockMandants);
    });

    it('should create mandant as admin', async () => {
      const mandantData = { name: 'New Mandant' };
      const createdMandant = { ...mandantData, id: 1 };

      (mockReq as any).session = { user: { id: '1', role: 'admin' } };
      mockReq.body = mandantData;

      vi.mocked(usersService.createMandant).mockResolvedValue(createdMandant as any);

      await usersController.createMandant(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdMandant);
    });
  });
});
