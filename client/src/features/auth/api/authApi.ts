/**
 * Auth API Client
 *
 * Handles all authentication-related API calls including:
 * - User login/logout
 * - Superadmin login
 * - Session management
 * - Auth status checks
 */

import { apiClient } from '@/lib/apiClient';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface UserLoginResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    role: string;
    userProfile?: {
      startPage?: string;
    };
  };
  message?: string;
}

export interface SuperadminLoginResponse {
  success: boolean;
  message?: string;
}

export const authApi = {
  /**
   * User login
   */
  async userLogin(credentials: LoginCredentials): Promise<UserLoginResponse> {
    return apiClient.post('/api/user-login', credentials);
  },

  /**
   * Superadmin login
   */
  async superadminLogin(credentials: LoginCredentials): Promise<SuperadminLoginResponse> {
    return apiClient.post('/api/superadmin-login', credentials);
  },

  /**
   * Logout current user
   */
  async logout(): Promise<{ success: boolean }> {
    return apiClient.post('/api/auth/logout');
  },

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<any> {
    return apiClient.get('/api/auth/user');
  },

  /**
   * Send heartbeat to extend session
   */
  async heartbeat(): Promise<{ success: boolean }> {
    return apiClient.post('/api/auth/heartbeat');
  },

  /**
   * Check authentication status
   */
  async checkAuth(): Promise<{ authenticated: boolean; user?: any }> {
    return apiClient.get('/api/auth/check');
  },
};
