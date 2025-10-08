import type { User, UserProfile, Mandant, UpsertUser, InsertUserProfile, InsertMandant } from "@shared/schema";

/**
 * Users Module Types
 *
 * This module handles user-related types including users, user profiles,
 * and mandants (client organizations).
 */

// Re-export shared types
export type {
  User,
  UserProfile,
  Mandant,
  UpsertUser,
  InsertUserProfile,
  InsertMandant,
};

// User with nested profile (joined query result)
export interface UserWithProfile extends Omit<User, 'userProfile'> {
  userProfile: UserProfile | null;
}

// User filters for query operations
export interface UserFilters {
  mandantId?: number;
  mandantIds?: number[];
  role?: string;
  email?: string;
  username?: string;
}

// User creation/update data
export interface CreateUserData extends UpsertUser {
  password: string;
}

export interface UpdateUserData extends Partial<UpsertUser> {
  id?: string;
}

// Mandant filters
export interface MandantFilters {
  category?: string;
  name?: string;
}

// User profile filters
export interface UserProfileFilters {
  name?: string;
}

// API Response types
export interface UserResponse extends Omit<User, 'password'> {
  userProfile?: UserProfile | null;
}

export interface UsersListResponse {
  users: UserResponse[];
  total: number;
}

export interface MandantsListResponse {
  mandants: Mandant[];
  total: number;
}

export interface UserProfilesListResponse {
  profiles: UserProfile[];
  total: number;
}
