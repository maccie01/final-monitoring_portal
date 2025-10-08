import bcrypt from "bcrypt";
import { usersRepository } from "./users.repository";
import type {
  User,
  UserProfile,
  Mandant,
  UpsertUser,
  InsertUserProfile,
  InsertMandant,
} from "@shared/schema";
import type {
  UserResponse,
  CreateUserData,
  UpdateUserData,
  UserFilters,
} from "./users.types";

/**
 * Users Service
 *
 * Business logic layer for user, user profile, and mandant operations.
 * Handles user management, password hashing, data validation, and access control.
 */

export class UsersService {
  /**
   * Get user by ID
   * Returns user without password field for security
   *
   * @param id - User ID
   * @returns User without password
   */
  async getUserById(id: string): Promise<UserResponse | null> {
    const user = await usersRepository.getUserById(id);
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  /**
   * Get user by username
   * Returns user without password field for security
   *
   * @param username - Username to search for
   * @returns User without password
   */
  async getUserByUsername(username: string): Promise<UserResponse | null> {
    const user = await usersRepository.getUserByUsername(username);
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  /**
   * Get user by email
   * Returns user without password field for security
   *
   * @param email - Email to search for
   * @returns User without password
   */
  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await usersRepository.getUserByEmail(email);
    if (!user) return null;
    return this.sanitizeUser(user);
  }

  /**
   * Get all users
   * Returns users without password fields for security
   *
   * @returns Array of users without passwords
   */
  async getAllUsers(): Promise<UserResponse[]> {
    const users = await usersRepository.getAllUsers();
    return users.map(user => this.sanitizeUser(user));
  }

  /**
   * Get users by mandant ID
   *
   * @param mandantId - Mandant ID to filter by
   * @returns Array of users belonging to the mandant
   */
  async getUsersByMandant(mandantId: number): Promise<UserResponse[]> {
    const users = await usersRepository.getUsersByMandant(mandantId);
    return users.map(user => this.sanitizeUser(user));
  }

  /**
   * Get users by multiple mandant IDs
   *
   * @param mandantIds - Array of mandant IDs to filter by
   * @returns Array of users belonging to any of the mandants
   */
  async getUsersByMandants(mandantIds: number[]): Promise<UserResponse[]> {
    const users = await usersRepository.getUsersByMandants(mandantIds);
    return users.map(user => this.sanitizeUser(user));
  }

  /**
   * Create a new user
   * Hashes password before storage
   *
   * @param userData - User data including plain text password
   * @returns Created user without password
   */
  async createUser(userData: CreateUserData): Promise<UserResponse> {
    // Validate required fields
    if (!userData.username) {
      throw new Error('Username is required');
    }
    if (!userData.password) {
      throw new Error('Password is required');
    }

    // Check if username already exists
    const existingUser = await usersRepository.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check if email already exists (if provided)
    if (userData.email) {
      const existingEmail = await usersRepository.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Hash password using bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with hashed password
    const user = await usersRepository.upsertUser({
      ...userData,
      password: hashedPassword,
    });

    return this.sanitizeUser(user);
  }

  /**
   * Update user by ID
   * Hashes password if provided
   *
   * @param id - User ID
   * @param userData - Partial user data to update
   * @returns Updated user without password
   */
  async updateUser(id: string, userData: UpdateUserData): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await usersRepository.getUserById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData: Partial<UpsertUser> = { ...userData };

    // Hash password if provided
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }

    // Check if username is being changed and already exists
    if (userData.username && userData.username !== existingUser.username) {
      const usernameExists = await usersRepository.getUserByUsername(userData.username);
      if (usernameExists) {
        throw new Error('Username already exists');
      }
    }

    // Check if email is being changed and already exists
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await usersRepository.getUserByEmail(userData.email);
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    // Update user
    const user = await usersRepository.updateUser(id, updateData);
    return this.sanitizeUser(user);
  }

  /**
   * Update user password
   *
   * @param id - User ID
   * @param newPassword - New plain text password
   * @returns Updated user without password
   */
  async updateUserPassword(id: string, newPassword: string): Promise<UserResponse> {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await usersRepository.updateUser(id, { password: hashedPassword });
    return this.sanitizeUser(user);
  }

  /**
   * Delete user by ID
   *
   * @param id - User ID to delete
   */
  async deleteUser(id: string): Promise<void> {
    const existingUser = await usersRepository.getUserById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    await usersRepository.deleteUser(id);
  }

  // ===== USER PROFILES =====

  /**
   * Get all user profiles
   *
   * @returns Array of user profiles
   */
  async getAllUserProfiles(): Promise<UserProfile[]> {
    return await usersRepository.getAllUserProfiles();
  }

  /**
   * Get user profile by ID
   *
   * @param id - Profile ID
   * @returns UserProfile if found
   */
  async getUserProfileById(id: number): Promise<UserProfile | null> {
    const profile = await usersRepository.getUserProfileById(id);
    return profile || null;
  }

  /**
   * Create user profile
   *
   * @param profile - Profile data to create
   * @returns Created user profile
   */
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    // Validate required fields
    if (!profile.name) {
      throw new Error('Profile name is required');
    }

    return await usersRepository.createUserProfile(profile);
  }

  /**
   * Update user profile
   *
   * @param id - Profile ID
   * @param profile - Partial profile data to update
   * @returns Updated user profile
   */
  async updateUserProfile(id: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    // Check if profile exists
    const existingProfile = await usersRepository.getUserProfileById(id);
    if (!existingProfile) {
      throw new Error('User profile not found');
    }

    return await usersRepository.updateUserProfile(id, profile);
  }

  /**
   * Delete user profile
   *
   * @param id - Profile ID to delete
   */
  async deleteUserProfile(id: number): Promise<void> {
    // Check if profile exists
    const existingProfile = await usersRepository.getUserProfileById(id);
    if (!existingProfile) {
      throw new Error('User profile not found');
    }

    // TODO: Check if profile is in use by any users before deletion
    // This could be added as a business rule

    await usersRepository.deleteUserProfile(id);
  }

  // ===== MANDANTS =====

  /**
   * Get all mandants
   *
   * @returns Array of mandants
   */
  async getAllMandants(): Promise<Mandant[]> {
    return await usersRepository.getAllMandants();
  }

  /**
   * Create mandant
   *
   * @param mandant - Mandant data to create
   * @returns Created mandant
   */
  async createMandant(mandant: InsertMandant): Promise<Mandant> {
    // Validate required fields
    if (!mandant.name) {
      throw new Error('Mandant name is required');
    }

    return await usersRepository.createMandant(mandant);
  }

  /**
   * Update mandant
   *
   * @param id - Mandant ID
   * @param mandant - Partial mandant data to update
   * @returns Updated mandant
   */
  async updateMandant(id: number, mandant: Partial<InsertMandant>): Promise<Mandant> {
    // Check if mandant exists by attempting to get all mandants and filtering
    const allMandants = await usersRepository.getAllMandants();
    const existingMandant = allMandants.find(m => m.id === id);

    if (!existingMandant) {
      throw new Error('Mandant not found');
    }

    return await usersRepository.updateMandant(id, mandant);
  }

  /**
   * Delete mandant
   *
   * @param id - Mandant ID to delete
   */
  async deleteMandant(id: number): Promise<void> {
    // Check if mandant exists
    const allMandants = await usersRepository.getAllMandants();
    const existingMandant = allMandants.find(m => m.id === id);

    if (!existingMandant) {
      throw new Error('Mandant not found');
    }

    // TODO: Check if mandant is in use by any users/objects before deletion
    // This could be added as a business rule

    await usersRepository.deleteMandant(id);
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Remove password field from user object
   * Creates a safe user response object
   *
   * @param user - User object with password
   * @returns User object without password
   */
  private sanitizeUser(user: any): UserResponse {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponse;
  }

  /**
   * Validate password strength
   *
   * @param password - Password to validate
   * @returns true if password meets requirements
   */
  private validatePasswordStrength(password: string): boolean {
    // Minimum 6 characters
    if (password.length < 6) {
      return false;
    }

    // Could add more complex validation rules here:
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character

    return true;
  }
}

// Singleton instance
export const usersService = new UsersService();
