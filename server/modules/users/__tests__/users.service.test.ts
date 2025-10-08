import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usersService } from '../users.service';
import { usersRepository } from '../users.repository';
import bcrypt from 'bcrypt';
import type { User, UserProfile, Mandant } from '@shared/schema';

// Mock dependencies
vi.mock('../users.repository', () => ({
  usersRepository: {
    getUserById: vi.fn(),
    getUserByUsername: vi.fn(),
    getUserByEmail: vi.fn(),
    getAllUsers: vi.fn(),
    getUsersByMandant: vi.fn(),
    getUsersByMandants: vi.fn(),
    upsertUser: vi.fn(),
    updateUser: vi.fn(),
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

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('UsersService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return sanitized user without password', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
      };

      vi.mocked(usersRepository.getUserById).mockResolvedValue(mockUser as any);

      const result = await usersService.getUserById('1');

      expect(result).toBeDefined();
      expect(result?.password).toBeUndefined();
      expect(result?.username).toBe('testuser');
    });

    it('should return null when user not found', async () => {
      vi.mocked(usersRepository.getUserById).mockResolvedValue(undefined);

      const result = await usersService.getUserById('999');

      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { id: '1', username: 'user1', password: 'hash1', email: 'user1@test.com' },
        { id: '2', username: 'user2', password: 'hash2', email: 'user2@test.com' },
      ];

      vi.mocked(usersRepository.getAllUsers).mockResolvedValue(mockUsers as any);

      const result = await usersService.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0].password).toBeUndefined();
      expect(result[1].password).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should hash password and create user', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'plainpassword',
        role: 'user',
      };

      const hashedPassword = '$2b$10$hashedpassword';
      const createdUser = { ...userData, id: '1', password: hashedPassword };

      vi.mocked(usersRepository.getUserByUsername).mockResolvedValue(undefined);
      vi.mocked(usersRepository.getUserByEmail).mockResolvedValue(undefined);
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
      vi.mocked(usersRepository.upsertUser).mockResolvedValue(createdUser as any);

      const result = await usersService.createUser(userData as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(usersRepository.upsertUser).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      expect(result.password).toBeUndefined();
    });

    it('should throw error if username already exists', async () => {
      const userData = {
        username: 'existinguser',
        email: 'new@example.com',
        password: 'password',
      };

      vi.mocked(usersRepository.getUserByUsername).mockResolvedValue({ id: '1' } as any);

      await expect(usersService.createUser(userData as any)).rejects.toThrow('Username already exists');
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password',
      };

      vi.mocked(usersRepository.getUserByUsername).mockResolvedValue(undefined);
      vi.mocked(usersRepository.getUserByEmail).mockResolvedValue({ id: '1' } as any);

      await expect(usersService.createUser(userData as any)).rejects.toThrow('Email already exists');
    });

    it('should throw error if username is missing', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password',
      };

      await expect(usersService.createUser(userData as any)).rejects.toThrow('Username is required');
    });

    it('should throw error if password is missing', async () => {
      const userData = {
        username: 'newuser',
        email: 'new@example.com',
      };

      await expect(usersService.createUser(userData as any)).rejects.toThrow('Password is required');
    });
  });

  describe('updateUser', () => {
    it('should update user and sanitize response', async () => {
      const existingUser = {
        id: '1',
        username: 'oldusername',
        email: 'old@example.com',
        password: 'oldhash',
      };

      const updateData = {
        username: 'newusername',
      };

      const updatedUser = { ...existingUser, ...updateData };

      vi.mocked(usersRepository.getUserById).mockResolvedValue(existingUser as any);
      vi.mocked(usersRepository.updateUser).mockResolvedValue(updatedUser as any);

      const result = await usersService.updateUser('1', updateData);

      expect(result.username).toBe('newusername');
      expect(result.password).toBeUndefined();
    });

    it('should hash password if provided in update', async () => {
      const existingUser = { id: '1', username: 'user', password: 'oldhash' };
      const updateData = { password: 'newpassword' };
      const hashedPassword = '$2b$10$newhash';

      vi.mocked(usersRepository.getUserById).mockResolvedValue(existingUser as any);
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
      vi.mocked(usersRepository.updateUser).mockResolvedValue({ ...existingUser, password: hashedPassword } as any);

      await usersService.updateUser('1', updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(usersRepository.updateUser).toHaveBeenCalledWith('1', { password: hashedPassword });
    });

    it('should throw error if user not found', async () => {
      vi.mocked(usersRepository.getUserById).mockResolvedValue(undefined);

      await expect(usersService.updateUser('999', {})).rejects.toThrow('User not found');
    });
  });

  describe('updateUserPassword', () => {
    it('should hash and update password', async () => {
      const hashedPassword = '$2b$10$newhash';
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
      vi.mocked(usersRepository.updateUser).mockResolvedValue({ id: '1', password: hashedPassword } as any);

      await usersService.updateUserPassword('1', 'newpassword123');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(usersRepository.updateUser).toHaveBeenCalledWith('1', { password: hashedPassword });
    });

    it('should throw error if password is too short', async () => {
      await expect(usersService.updateUserPassword('1', '12345')).rejects.toThrow('at least 6 characters');
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      vi.mocked(usersRepository.getUserById).mockResolvedValue({ id: '1' } as any);
      vi.mocked(usersRepository.deleteUser).mockResolvedValue(undefined);

      await usersService.deleteUser('1');

      expect(usersRepository.deleteUser).toHaveBeenCalledWith('1');
    });

    it('should throw error if user not found', async () => {
      vi.mocked(usersRepository.getUserById).mockResolvedValue(undefined);

      await expect(usersService.deleteUser('999')).rejects.toThrow('User not found');
    });
  });

  describe('User Profiles', () => {
    it('should get all user profiles', async () => {
      const mockProfiles = [
        { id: 1, name: 'Profile1', startPage: '/dashboard' },
        { id: 2, name: 'Profile2', startPage: '/maps' },
      ];

      vi.mocked(usersRepository.getAllUserProfiles).mockResolvedValue(mockProfiles as any);

      const result = await usersService.getAllUserProfiles();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Profile1');
    });

    it('should create user profile', async () => {
      const profileData = { name: 'New Profile', startPage: '/dashboard' };
      const createdProfile = { ...profileData, id: 1 };

      vi.mocked(usersRepository.createUserProfile).mockResolvedValue(createdProfile as any);

      const result = await usersService.createUserProfile(profileData as any);

      expect(result.name).toBe('New Profile');
    });

    it('should throw error when creating profile without name', async () => {
      await expect(usersService.createUserProfile({} as any)).rejects.toThrow('Profile name is required');
    });
  });

  describe('Mandants', () => {
    it('should get all mandants', async () => {
      const mockMandants = [
        { id: 1, name: 'Mandant1', description: 'Test' },
        { id: 2, name: 'Mandant2', description: 'Test2' },
      ];

      vi.mocked(usersRepository.getAllMandants).mockResolvedValue(mockMandants as any);

      const result = await usersService.getAllMandants();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Mandant1');
    });

    it('should create mandant', async () => {
      const mandantData = { name: 'New Mandant', description: 'Test' };
      const createdMandant = { ...mandantData, id: 1 };

      vi.mocked(usersRepository.createMandant).mockResolvedValue(createdMandant as any);

      const result = await usersService.createMandant(mandantData as any);

      expect(result.name).toBe('New Mandant');
    });

    it('should throw error when creating mandant without name', async () => {
      await expect(usersService.createMandant({} as any)).rejects.toThrow('Mandant name is required');
    });
  });
});
