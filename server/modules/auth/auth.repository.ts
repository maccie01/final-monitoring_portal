import { getDb } from "../../db";
import { users, userProfiles } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import type { User, UserProfile } from "@shared/schema";

/**
 * Auth Repository
 *
 * Data access layer for authentication operations.
 * Handles direct database queries for user authentication.
 */

export class AuthRepository {
  /**
   * Find user by username or email
   * Used for authentication - returns user with password hash
   *
   * @param usernameOrEmail - Username or email to search for
   * @returns User object if found, undefined otherwise
   */
  async findUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await getDb()
      .select()
      .from(users)
      .where(or(
        eq(users.username, usernameOrEmail),
        eq(users.email, usernameOrEmail)
      ))
      .limit(1);

    return user;
  }

  /**
   * Find user by ID with joined user profile
   * Optimized query with LEFT JOIN to avoid N+1 problem
   *
   * @param userId - User ID to search for
   * @returns User with profile data if found
   */
  async findUserByIdWithProfile(userId: string): Promise<any | undefined> {
    const result = await getDb()
      .select({
        // User fields
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        role: users.role,
        mandantId: users.mandantId,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        userProfileId: users.userProfileId,
        address: users.address,
        mandantAccess: users.mandantAccess,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        // UserProfile fields (nested object)
        userProfile: {
          id: userProfiles.id,
          name: userProfiles.name,
          startPage: userProfiles.startPage,
          sidebar: userProfiles.sidebar,
          createdAt: userProfiles.createdAt,
          updatedAt: userProfiles.updatedAt,
        },
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.userProfileId, userProfiles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!result[0]) return undefined;

    // Transform result - set userProfile to null if no profile exists
    const user = result[0];
    return {
      ...user,
      userProfile: user.userProfile?.id ? user.userProfile : null,
    };
  }

  /**
   * Get user profile by ID
   *
   * @param profileId - Profile ID to fetch
   * @returns UserProfile if found
   */
  async getUserProfile(profileId: number): Promise<UserProfile | undefined> {
    const [profile] = await getDb()
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, profileId))
      .limit(1);

    return profile;
  }
}

// Singleton instance
export const authRepository = new AuthRepository();
