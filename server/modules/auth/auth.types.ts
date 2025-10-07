import type { User } from "@shared/schema";

/**
 * Auth Module Types
 *
 * This module handles authentication-related types including
 * credentials, session data, and superadmin configuration.
 */

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// Session user data
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userProfileId: number | null;
  mandantId: number | null;
  mandantAccess?: number[] | null;
  mandantRole?: string;
  sessionStart?: number;
  lastActivity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Superadmin configuration
export interface SuperadminConfig {
  username: string;
  password: string;
}

// Setup app configuration structure
export interface SetupAppConfig {
  'Login-user'?: {
    enabled: boolean;
    check_superadmin: boolean;
  };
  Superadmin?: Array<{ [username: string]: string }>;
}

// User profile sidebar configuration
export interface UserProfileSidebar {
  showSystemSetup: boolean;
  showLogbook: boolean;
  showDashboard: boolean;
  showEnergyData: boolean;
  showNetworkMonitor: boolean;
  showUserManagement: boolean;
  showObjectManagement: boolean;
  showGrafanaDashboards: boolean;
  showEfficiencyStrategy: boolean;
}

// User profile data for API responses
export interface UserProfileData {
  id: number | null;
  name: string;
  startPage: string;
  sidebar: UserProfileSidebar;
  createdAt?: Date;
  updatedAt?: Date;
}

// Complete user data for API responses
export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  userProfileId: number | null;
  mandantId: number | null;
  userProfile?: UserProfileData | null;
  mandantAccess?: number[] | null;
}

// Login response
export interface LoginResponse {
  message: string;
  user: AuthUserResponse;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  user?: User;
  isSuperadmin?: boolean;
}
