import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from '../auth.service';
import { authRepository } from '../auth.repository';
import bcrypt from 'bcrypt';
import type { User } from '@shared/schema';

// Mock dependencies
vi.mock('../auth.repository', () => ({
  authRepository: {
    findUserByUsernameOrEmail: vi.fn(),
    getUserProfile: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

// Mock fs for setup-app.json reading
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clear environment variables
    delete process.env.SUPERADMIN_USERNAME;
    delete process.env.SUPERADMIN_PASSWORD;
  });

  describe('validateUserCredentials', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser: Partial<User> = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$12$hashedpassword',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
      };

      vi.mocked(authRepository.findUserByUsernameOrEmail).mockResolvedValue(mockUser as User);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.validateUserCredentials('testuser', 'password123');

      expect(result).toEqual(mockUser);
      expect(authRepository.findUserByUsernameOrEmail).toHaveBeenCalledWith('testuser');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', '$2b$12$hashedpassword');
    });

    it('should return null when password is invalid', async () => {
      const mockUser: Partial<User> = {
        id: '1',
        username: 'testuser',
        password: '$2b$12$hashedpassword',
      };

      vi.mocked(authRepository.findUserByUsernameOrEmail).mockResolvedValue(mockUser as User);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.validateUserCredentials('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null when user not found (timing attack prevention)', async () => {
      vi.mocked(authRepository.findUserByUsernameOrEmail).mockResolvedValue(undefined);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.validateUserCredentials('nonexistent', 'password');

      expect(result).toBeNull();
      // Should still call bcrypt.compare to prevent timing attacks
      expect(bcrypt.compare).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(authRepository.findUserByUsernameOrEmail).mockRejectedValue(new Error('Database error'));

      const result = await authService.validateUserCredentials('testuser', 'password');

      expect(result).toBeNull();
    });
  });

  describe('validateSuperadminCredentials', () => {
    it('should validate superadmin from environment variables', () => {
      process.env.SUPERADMIN_USERNAME = 'admin';
      process.env.SUPERADMIN_PASSWORD = 'admin123';

      const result = authService.validateSuperadminCredentials('admin', 'admin123');

      expect(result).toBe(true);
    });

    it('should reject invalid superadmin credentials', () => {
      process.env.SUPERADMIN_USERNAME = 'admin';
      process.env.SUPERADMIN_PASSWORD = 'admin123';

      const result = authService.validateSuperadminCredentials('admin', 'wrongpassword');

      expect(result).toBe(false);
    });

    it('should return false when no superadmin configured', () => {
      const result = authService.validateSuperadminCredentials('admin', 'admin123');

      expect(result).toBe(false);
    });
  });

  describe('createSuperadminSession', () => {
    it('should create superadmin session data', () => {
      const session = authService.createSuperadminSession();

      expect(session).toMatchObject({
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
        mandantRole: 'superadmin',
      });
      expect(session.sessionStart).toBeDefined();
      expect(session.lastActivity).toBeDefined();
    });
  });

  describe('createUserSession', () => {
    it('should create user session data', () => {
      const mockUser: Partial<User> = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        userProfileId: 1,
        mandantId: 1,
        mandantAccess: [1, 2],
      };

      const session = authService.createUserSession(mockUser as User);

      expect(session).toMatchObject({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        userProfileId: 1,
        mandantId: 1,
        mandantAccess: [1, 2],
      });
      expect(session.sessionStart).toBeDefined();
      expect(session.lastActivity).toBeDefined();
    });
  });

  describe('getSuperadminProfile', () => {
    it('should return superadmin profile data', () => {
      const profile = authService.getSuperadminProfile();

      expect(profile).toMatchObject({
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
      });
      expect(profile.userProfile).toBeDefined();
      expect(profile.userProfile?.startPage).toBe('/system-setup');
      expect(profile.userProfile?.sidebar.showSystemSetup).toBe(true);
    });
  });

  describe('getCurrentUserData', () => {
    it('should return superadmin profile for superadmin session', async () => {
      const sessionUser = {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
      };

      const result = await authService.getCurrentUserData(sessionUser);

      expect(result.role).toBe('superadmin');
      expect(result.userProfile?.startPage).toBe('/system-setup');
    });

    it('should return user data with profile', async () => {
      const sessionUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        userProfileId: 1,
        mandantId: 1,
      };

      const mockProfile = {
        id: 1,
        name: 'Admin Profile',
        startPage: '/dashboard',
        sidebar: {
          showSystemSetup: false,
          showDashboard: true,
          showLogbook: true,
          showEnergyData: true,
          showNetworkMonitor: true,
          showUserManagement: true,
          showObjectManagement: true,
          showGrafanaDashboards: true,
          showEfficiencyStrategy: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(authRepository.getUserProfile).mockResolvedValue(mockProfile);

      const result = await authService.getCurrentUserData(sessionUser);

      expect(result.userProfile).toBeDefined();
      expect(result.userProfile?.name).toBe('Admin Profile');
    });

    it('should return default profile when user profile not found', async () => {
      const sessionUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        userProfileId: null,
        mandantId: 1,
      };

      const result = await authService.getCurrentUserData(sessionUser);

      expect(result.userProfile).toBeDefined();
      expect(result.userProfile?.name).toBe('Standard User');
      expect(result.userProfile?.startPage).toBe('/dashboard');
    });
  });

  describe('prepareLoginResponse', () => {
    it('should prepare superadmin login response', () => {
      const mockUser = {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
      };

      const result = authService.prepareLoginResponse(mockUser, true);

      expect(result).toMatchObject({
        id: 'superadmin',
        role: 'superadmin',
      });
    });

    it('should prepare regular user login response', () => {
      const mockUser: Partial<User> = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
        userProfileId: 1,
        mandantId: 1,
      };

      const result = authService.prepareLoginResponse(mockUser as User, false);

      expect(result).toMatchObject({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        userProfileId: 1,
        mandantId: 1,
      });
    });
  });
});
