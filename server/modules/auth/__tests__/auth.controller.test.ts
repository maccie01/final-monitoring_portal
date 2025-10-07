import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { authController } from '../auth.controller';
import { authService } from '../auth.service';

// Mock authService
vi.mock('../auth.service', () => ({
  authService: {
    validateSuperadminCredentials: vi.fn(),
    createSuperadminSession: vi.fn(),
    prepareLoginResponse: vi.fn(),
    validateCredentials: vi.fn(),
    createUserSession: vi.fn(),
    getSuperadminProfile: vi.fn(),
    getCurrentUserData: vi.fn(),
  },
}));

// Mock error middleware
vi.mock('../../../middleware/error', () => ({
  asyncHandler: (fn: any) => fn,
  createAuthError: (msg: string) => new Error(msg),
  createValidationError: (msg: string) => new Error(msg),
}));

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnThis();

    mockReq = {
      body: {},
      session: {},
    };

    mockRes = {
      json: jsonMock,
      status: statusMock,
    };
  });

  describe('superadminLogin', () => {
    it('should login superadmin successfully', async () => {
      mockReq.body = { username: 'admin', password: 'admin123' };

      const mockSession = {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
        mandantRole: 'superadmin',
      };

      const mockResponse = {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
      };

      vi.mocked(authService.validateSuperadminCredentials).mockReturnValue(true);
      vi.mocked(authService.createSuperadminSession).mockReturnValue(mockSession);
      vi.mocked(authService.prepareLoginResponse).mockReturnValue(mockResponse);

      await authController.superadminLogin(mockReq as Request, mockRes as Response);

      expect(authService.validateSuperadminCredentials).toHaveBeenCalledWith('admin', 'admin123');
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Superadmin erfolgreich angemeldet',
        user: mockResponse,
      });
    });

    it('should reject invalid superadmin credentials', async () => {
      mockReq.body = { username: 'admin', password: 'wrongpassword' };

      vi.mocked(authService.validateSuperadminCredentials).mockReturnValue(false);

      await expect(
        authController.superadminLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Ungültige Superadmin-Anmeldedaten');
    });

    it('should validate required fields', async () => {
      mockReq.body = { username: 'admin' }; // missing password

      await expect(
        authController.superadminLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Benutzername und Passwort erforderlich');
    });
  });

  describe('userLogin', () => {
    it('should login regular user successfully', async () => {
      mockReq.body = { username: 'testuser', password: 'password123' };

      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        firstName: 'Test',
        lastName: 'User',
      };

      const mockSession = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        userProfileId: null,
        mandantId: null,
      };

      const mockResponse = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        userProfileId: null,
        mandantId: null,
      };

      vi.mocked(authService.validateCredentials).mockResolvedValue({
        isValid: true,
        user: mockUser as any,
        isSuperadmin: false,
      });
      vi.mocked(authService.createUserSession).mockReturnValue(mockSession);
      vi.mocked(authService.prepareLoginResponse).mockReturnValue(mockResponse);

      await authController.userLogin(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Erfolgreich angemeldet',
        user: mockResponse,
      });
    });

    it('should handle superadmin login via user endpoint', async () => {
      mockReq.body = { username: 'admin', password: 'admin123' };

      const mockSuperadminProfile = {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
      };

      vi.mocked(authService.validateCredentials).mockResolvedValue({
        isValid: true,
        isSuperadmin: true,
      });
      vi.mocked(authService.getSuperadminProfile).mockReturnValue(mockSuperadminProfile);

      await authController.userLogin(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Superadmin erfolgreich angemeldet',
        user: mockSuperadminProfile,
      });
    });

    it('should reject invalid credentials', async () => {
      mockReq.body = { username: 'testuser', password: 'wrongpassword' };

      vi.mocked(authService.validateCredentials).mockResolvedValue({
        isValid: false,
      });

      await expect(
        authController.userLogin(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Ungültige Anmeldedaten');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const mockSessionUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        userProfileId: null,
        mandantId: null,
      };

      const mockUserData = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        userProfileId: null,
        mandantId: null,
        userProfile: {
          id: null,
          name: 'Standard User',
          startPage: '/dashboard',
          sidebar: {},
        },
      };

      (mockReq as any).session = { user: mockSessionUser };

      vi.mocked(authService.getCurrentUserData).mockResolvedValue(mockUserData);

      await authController.getCurrentUser(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(mockUserData);
    });

    it('should reject request without session', async () => {
      (mockReq as any).session = {};

      await expect(
        authController.getCurrentUser(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('No valid session found');
    });
  });

  describe('logout', () => {
    it('should destroy session and logout', async () => {
      const destroyMock = vi.fn((cb) => cb(null));
      (mockReq as any).session = { destroy: destroyMock };

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(destroyMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should handle logout without session', async () => {
      (mockReq as any).session = null;

      await authController.logout(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should handle session destruction error', async () => {
      const destroyMock = vi.fn((cb) => cb(new Error('Session error')));
      (mockReq as any).session = { destroy: destroyMock };

      await expect(
        authController.logout(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('Logout failed');
    });
  });

  describe('heartbeat', () => {
    it('should extend session on heartbeat', async () => {
      const mockSessionUser = {
        id: '1',
        role: 'user',
        lastActivity: Date.now(),
      };

      (mockReq as any).session = { user: mockSessionUser };

      await authController.heartbeat(mockReq as Request, mockRes as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Session extended',
          timestamp: expect.any(String),
        })
      );
    });

    it('should reject heartbeat without session', async () => {
      (mockReq as any).session = {};

      await expect(
        authController.heartbeat(mockReq as Request, mockRes as Response)
      ).rejects.toThrow('No active session');
    });
  });
});
