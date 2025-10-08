import bcrypt from "bcrypt";
import { readFileSync } from "fs";
import { join } from "path";
import { authRepository } from "./auth.repository";
import type {
  LoginCredentials,
  SuperadminConfig,
  SetupAppConfig,
  ValidationResult,
  SessionUser,
  UserProfileSidebar,
  AuthUserResponse,
} from "./auth.types";
import type { User } from "@shared/schema";

/**
 * Auth Service
 *
 * Business logic layer for authentication operations.
 * Handles password validation, superadmin checks, and session data preparation.
 */

export class AuthService {
  /**
   * Validate user credentials against database
   * Uses bcrypt for secure password comparison
   * Implements timing attack prevention
   *
   * @param username - Username or email
   * @param password - Plain text password
   * @returns User object if credentials are valid, null otherwise
   */
  async validateUserCredentials(username: string, password: string): Promise<User | null> {
    try {
      // Find user by username or email
      const user = await authRepository.findUserByUsernameOrEmail(username);

      if (!user || !user.password) {
        // User not found - use dummy bcrypt.compare to prevent timing attacks
        await bcrypt.compare(password, '$2b$12$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxxxxxxxxxxxxx');
        return null;
      }

      // Secure password comparison using bcrypt
      const isValid = await bcrypt.compare(password, user.password);

      if (isValid) {
        return user;
      }

      return null;
    } catch (error) {
      console.error('Error validating user credentials:', error);
      return null;
    }
  }

  /**
   * Load superadmin configuration from setup-app.json
   *
   * @returns SuperadminConfig array or null if not available
   */
  private loadSuperadminConfig(): SuperadminConfig[] | null {
    try {
      const configPath = join(process.cwd(), 'server', 'setup-app.json');
      const configData = readFileSync(configPath, 'utf8');
      const config: SetupAppConfig = JSON.parse(configData);

      if (config['Login-user']?.enabled && config['Login-user']?.check_superadmin && config.Superadmin) {
        // Convert config format to SuperadminConfig array
        return config.Superadmin.map(entry => {
          const username = Object.keys(entry)[0];
          const password = entry[username];
          return { username, password };
        });
      }

      return null;
    } catch (error) {
      console.error('Error loading superadmin config:', error);
      return null;
    }
  }

  /**
   * Check if credentials match a superadmin account
   * Checks both setup-app.json and environment variables
   *
   * @param username - Username to check
   * @param password - Password to check
   * @returns true if valid superadmin credentials
   */
  validateSuperadminCredentials(username: string, password: string): boolean {
    // Check setup-app.json first
    const superadminConfigs = this.loadSuperadminConfig();
    if (superadminConfigs) {
      const isValid = superadminConfigs.some(
        config => config.username === username && config.password === password
      );
      if (isValid) {
        console.log(`✅ Superadmin authentication successful for: ${username}`);
        return true;
      }
    }

    // Check environment variables
    const envSuperadminUser = process.env.SUPERADMIN_USERNAME;
    const envSuperadminPass = process.env.SUPERADMIN_PASSWORD;

    if (envSuperadminUser && envSuperadminPass) {
      if (username === envSuperadminUser && password === envSuperadminPass) {
        console.log('✅ Environment variable superadmin authentication successful');
        return true;
      }
    }

    return false;
  }

  /**
   * Validate credentials against both superadmin and regular users
   *
   * @param credentials - Login credentials
   * @returns Validation result with user data
   */
  async validateCredentials(credentials: LoginCredentials): Promise<ValidationResult> {
    const { username, password } = credentials;

    // Check superadmin first
    const isSuperadmin = this.validateSuperadminCredentials(username, password);
    if (isSuperadmin) {
      return { isValid: true, isSuperadmin: true };
    }

    // Check regular user
    const user = await this.validateUserCredentials(username, password);
    if (user) {
      return { isValid: true, user, isSuperadmin: false };
    }

    return { isValid: false };
  }

  /**
   * Create superadmin session data
   *
   * @returns SessionUser object for superadmin
   */
  createSuperadminSession(): SessionUser {
    return {
      id: 'superadmin',
      email: 'superadmin@system.local',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      userProfileId: null,
      mandantId: null,
      mandantRole: 'superadmin',
      sessionStart: Date.now(),
      lastActivity: Date.now(),
    };
  }

  /**
   * Create regular user session data
   *
   * @param user - User object from database
   * @returns SessionUser object for regular user
   */
  createUserSession(user: User): SessionUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userProfileId: user.userProfileId,
      mandantId: user.mandantId,
      mandantAccess: user.mandantAccess,
      sessionStart: Date.now(),
      lastActivity: Date.now(),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Get superadmin profile configuration
   *
   * @returns Superadmin user profile data
   */
  getSuperadminProfile(): AuthUserResponse {
    return {
      id: 'superadmin',
      email: 'superadmin@system.local',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      userProfileId: null,
      mandantId: null,
      userProfile: {
        id: null,
        name: 'Superadmin',
        startPage: '/system-setup',
        sidebar: {
          showSystemSetup: true,
          showLogbook: false,
          showDashboard: false,
          showEnergyData: false,
          showNetworkMonitor: false,
          showUserManagement: false,
          showObjectManagement: false,
          showGrafanaDashboards: false,
          showEfficiencyStrategy: false,
        },
      },
    };
  }

  /**
   * Get default sidebar configuration based on role
   *
   * @param role - User role
   * @returns UserProfileSidebar configuration
   */
  private getDefaultSidebar(role: string): UserProfileSidebar {
    if (role === 'admin') {
      return {
        showSystemSetup: false,
        showLogbook: true,
        showDashboard: true,
        showEnergyData: true,
        showNetworkMonitor: true,
        showUserManagement: true,
        showObjectManagement: true,
        showGrafanaDashboards: true,
        showEfficiencyStrategy: true,
      };
    }

    // Default for regular users
    return {
      showSystemSetup: false,
      showLogbook: true,
      showDashboard: true,
      showEnergyData: true,
      showNetworkMonitor: true,
      showUserManagement: false,
      showObjectManagement: false,
      showGrafanaDashboards: true,
      showEfficiencyStrategy: true,
    };
  }

  /**
   * Get current user data by session user ID
   *
   * @param sessionUser - Session user data
   * @returns Complete user data for API response
   */
  async getCurrentUserData(sessionUser: SessionUser): Promise<AuthUserResponse> {
    // Handle superadmin
    if (sessionUser.role === 'superadmin') {
      return this.getSuperadminProfile();
    }

    // Get user profile if exists
    let userProfile = null;
    if (sessionUser.userProfileId) {
      try {
        const profile = await authRepository.getUserProfile(sessionUser.userProfileId);
        if (profile) {
          userProfile = {
            id: profile.id,
            name: profile.name,
            startPage: profile.startPage || '/dashboard',
            sidebar: (profile.sidebar as UserProfileSidebar) || this.getDefaultSidebar(sessionUser.role),
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          };
        }
      } catch (error) {
        console.warn('Could not load user profile:', error);
      }
    }

    // If no profile exists, create default
    if (!userProfile) {
      userProfile = {
        id: null,
        name: sessionUser.role === 'admin' ? 'Default Admin' : 'Standard User',
        startPage: '/dashboard',
        sidebar: this.getDefaultSidebar(sessionUser.role),
      };
    }

    return {
      id: sessionUser.id,
      email: sessionUser.email,
      firstName: sessionUser.firstName,
      lastName: sessionUser.lastName,
      role: sessionUser.role,
      userProfileId: sessionUser.userProfileId,
      mandantId: sessionUser.mandantId,
      mandantAccess: sessionUser.mandantAccess,
      userProfile,
    };
  }

  /**
   * Prepare login response data
   *
   * @param user - User or SessionUser object
   * @param isSuperadmin - Whether this is a superadmin login
   * @returns Login response object
   */
  prepareLoginResponse(user: User | SessionUser, isSuperadmin: boolean): AuthUserResponse {
    if (isSuperadmin) {
      return {
        id: 'superadmin',
        email: 'superadmin@system.local',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'superadmin',
        userProfileId: null,
        mandantId: null,
      };
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      userProfileId: user.userProfileId || null,
      mandantId: user.mandantId || null,
    };
  }
}

// Singleton instance
export const authService = new AuthService();
