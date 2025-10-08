/**
 * Users Module
 *
 * Exports all public APIs from the users module.
 * This module handles user management, user profiles, and mandants.
 */

export { usersRepository } from './users.repository';
export { usersService } from './users.service';
export { usersController } from './users.controller';
export { default as usersRoutes } from './users.routes';

// Re-export types
export type {
  User,
  UserProfile,
  Mandant,
  UpsertUser,
  InsertUserProfile,
  InsertMandant,
  UserWithProfile,
  UserFilters,
  CreateUserData,
  UpdateUserData,
  MandantFilters,
  UserProfileFilters,
  UserResponse,
  UsersListResponse,
  MandantsListResponse,
  UserProfilesListResponse,
} from './users.types';
