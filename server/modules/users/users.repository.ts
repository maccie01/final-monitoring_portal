import { getDb } from "../../db";
import { users, userProfiles, mandants } from "@shared/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { ConnectionPoolManager } from "../../connection-pool";
import type { User, UserProfile, Mandant, UpsertUser, InsertUserProfile, InsertMandant } from "@shared/schema";

/**
 * Users Repository
 *
 * Data access layer for user operations.
 * Handles direct database queries for users, user profiles, and mandants.
 */

export class UsersRepository {
  /**
   * Get user by ID with joined user profile
   * Optimized query with LEFT JOIN to avoid N+1 problem
   *
   * @param id - User ID
   * @returns User with profile data if found
   */
  async getUserById(id: string): Promise<any | undefined> {
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
      .where(eq(users.id, id))
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
   * Get user by username with joined user profile
   *
   * @param username - Username to search for
   * @returns User with profile data if found
   */
  async getUserByUsername(username: string): Promise<any | undefined> {
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
      .where(eq(users.username, username))
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
   * Get user by email with joined user profile
   *
   * @param email - Email to search for
   * @returns User with profile data if found
   */
  async getUserByEmail(email: string): Promise<any | undefined> {
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
      .where(eq(users.email, email))
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
   * Get all users with joined user profiles
   *
   * @returns Array of users with profile data
   */
  async getAllUsers(): Promise<any[]> {
    const results = await getDb()
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
      .orderBy(users.createdAt);

    // Transform results - set userProfile to null if no profile exists
    return results.map(user => ({
      ...user,
      userProfile: user.userProfile?.id ? user.userProfile : null,
    }));
  }

  /**
   * Get users by mandant ID
   *
   * @param mandantId - Mandant ID to filter by
   * @returns Array of users belonging to the mandant
   */
  async getUsersByMandant(mandantId: number): Promise<any[]> {
    const results = await getDb()
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
      .where(eq(users.mandantId, mandantId))
      .orderBy(users.username);

    // Transform results - set userProfile to null if no profile exists
    return results.map(user => ({
      ...user,
      userProfile: user.userProfile?.id ? user.userProfile : null,
    }));
  }

  /**
   * Get users by multiple mandant IDs
   *
   * @param mandantIds - Array of mandant IDs to filter by
   * @returns Array of users belonging to any of the mandants
   */
  async getUsersByMandants(mandantIds: number[]): Promise<any[]> {
    if (!mandantIds || mandantIds.length === 0) {
      return [];
    }

    const results = await getDb()
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
      .where(inArray(users.mandantId, mandantIds))
      .orderBy(users.username);

    // Transform results - set userProfile to null if no profile exists
    return results.map(user => ({
      ...user,
      userProfile: user.userProfile?.id ? user.userProfile : null,
    }));
  }

  /**
   * Create or update user (upsert)
   *
   * @param userData - User data to insert or update
   * @returns Created or updated user
   */
  async upsertUser(userData: UpsertUser): Promise<User> {
    // For new users: Insert without conflict
    if (!userData.id) {
      // Ensure SEQUENCE exists in Portal-DB
      try {
        await getDb().execute(sql`CREATE SEQUENCE IF NOT EXISTS user_id_seq START 100 INCREMENT 1`);
      } catch (e) {
        console.log("SEQUENCE already exists or created");
      }

      // PostgreSQL Sequence for auto-incrementing from 100
      const result = await getDb().execute(sql`SELECT nextval('user_id_seq') as next_id`);
      const nextId = Number(result.rows[0].next_id);

      const [user] = await getDb()
        .insert(users)
        .values({ ...userData, id: nextId.toString() })
        .returning();
      return user;
    }

    // For existing users: Direct update
    const [user] = await getDb()
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userData.id))
      .returning();
    return user;
  }

  /**
   * Update user by ID
   *
   * @param id - User ID
   * @param userData - Partial user data to update
   * @returns Updated user
   */
  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    // Clean userData - remove non-existent fields
    const cleanUserData = { ...userData } as any;
    delete cleanUserData.groupIds;
    delete cleanUserData.autoId;

    // Convert mandantAccess array-string to real array for PostgreSQL
    if (cleanUserData.mandantAccess !== undefined) {
      // If it's an empty object {}, set to empty array
      if (typeof cleanUserData.mandantAccess === 'object' &&
          !Array.isArray(cleanUserData.mandantAccess) &&
          Object.keys(cleanUserData.mandantAccess).length === 0) {
        cleanUserData.mandantAccess = [];
      }
      // If it's a string, parse it
      else if (typeof cleanUserData.mandantAccess === 'string') {
        try {
          const parsed = JSON.parse(cleanUserData.mandantAccess);
          cleanUserData.mandantAccess = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error('Error parsing mandantAccess:', e);
          cleanUserData.mandantAccess = [];
        }
      }
      // Ensure all values are numbers
      if (Array.isArray(cleanUserData.mandantAccess)) {
        cleanUserData.mandantAccess = cleanUserData.mandantAccess.map(Number).filter((n: number) => !isNaN(n));
      }
    }

    const [user] = await getDb()
      .update(users)
      .set({
        ...cleanUserData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  /**
   * Delete user by ID
   *
   * @param id - User ID to delete
   */
  async deleteUser(id: string): Promise<void> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting user from Portal-DB:', error);
      // Fallback to development DB
      await getDb().delete(users).where(eq(users.id, id));
    }
  }

  // ===== USER PROFILES =====

  /**
   * Get all user profiles
   *
   * @returns Array of user profiles
   */
  async getAllUserProfiles(): Promise<UserProfile[]> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'SELECT id, name, start_page, sidebar, created_at, updated_at FROM user_profiles ORDER BY name'
      );
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        startPage: row.start_page,
        sidebar: row.sidebar,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching user profiles from Portal-DB:', error);
      // Fallback to development DB
      return await getDb().select().from(userProfiles).orderBy(userProfiles.name);
    }
  }

  /**
   * Get user profile by ID
   *
   * @param id - Profile ID
   * @returns UserProfile if found
   */
  async getUserProfileById(id: number): Promise<UserProfile | undefined> {
    const [profile] = await getDb()
      .select({
        id: userProfiles.id,
        name: userProfiles.name,
        startPage: userProfiles.startPage,
        sidebar: userProfiles.sidebar,
        createdAt: userProfiles.createdAt,
        updatedAt: userProfiles.updatedAt,
      })
      .from(userProfiles)
      .where(eq(userProfiles.id, id));
    return profile;
  }

  /**
   * Create user profile
   *
   * @param profile - Profile data to create
   * @returns Created user profile
   */
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'INSERT INTO user_profiles (name, start_page, sidebar) VALUES ($1, $2, $3) RETURNING id, name, start_page, sidebar, created_at, updated_at',
        [profile.name, profile.startPage || '/maps', JSON.stringify(profile.sidebar)]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        startPage: row.start_page,
        sidebar: row.sidebar,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
    } catch (error) {
      console.error('Error creating user profile in Portal-DB:', error);
      // Fallback to development DB
      const insertData: any = {
        name: profile.name,
      };
      if (profile.startPage !== undefined) insertData.startPage = profile.startPage;
      if (profile.sidebar !== undefined) insertData.sidebar = profile.sidebar;
      const [newProfile] = await getDb().insert(userProfiles).values(insertData).returning();
      return newProfile;
    }
  }

  /**
   * Update user profile
   *
   * @param id - Profile ID
   * @param profile - Partial profile data to update
   * @returns Updated user profile
   */
  async updateUserProfile(id: number, profile: Partial<InsertUserProfile>): Promise<UserProfile> {
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only add fields that are defined in the profile parameter
    if (profile.name !== undefined) updateData.name = profile.name;
    if (profile.startPage !== undefined) updateData.startPage = profile.startPage;
    if (profile.sidebar !== undefined) {
      updateData.sidebar = profile.sidebar;
    }

    const [updatedProfile] = await getDb()
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.id, id))
      .returning();
    return updatedProfile;
  }

  /**
   * Delete user profile
   *
   * @param id - Profile ID to delete
   */
  async deleteUserProfile(id: number): Promise<void> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      await pool.query('DELETE FROM user_profiles WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting user profile from Portal-DB:', error);
      // Fallback to development DB
      await getDb().delete(userProfiles).where(eq(userProfiles.id, id));
    }
  }

  // ===== MANDANTS =====

  /**
   * Get all mandants
   *
   * @returns Array of mandants
   */
  async getAllMandants(): Promise<Mandant[]> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'SELECT id, name, description, category, info, created_at FROM mandants ORDER BY name'
      );
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        info: row.info,
        createdAt: new Date(row.created_at)
      }));
    } catch (error) {
      console.error('Error fetching mandants from Portal-DB:', error);
      // Fallback to development DB
      const result = await getDb().select().from(mandants).orderBy(mandants.name);
      return result;
    }
  }

  /**
   * Create mandant
   *
   * @param mandant - Mandant data to create
   * @returns Created mandant
   */
  async createMandant(mandant: InsertMandant): Promise<Mandant> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(
        'INSERT INTO mandants (name, description, category, info) VALUES ($1, $2, $3, $4) RETURNING id, name, description, category, info, created_at',
        [mandant.name, mandant.description, mandant.category, JSON.stringify(mandant.info)]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        info: row.info,
        description: row.description,
        createdAt: new Date(row.created_at)
      };
    } catch (error) {
      console.error('Error creating mandant in Portal-DB:', error);
      // Fallback to development DB
      const [newMandant] = await getDb().insert(mandants).values(mandant).returning();
      return newMandant;
    }
  }

  /**
   * Update mandant
   *
   * @param id - Mandant ID
   * @param mandant - Partial mandant data to update
   * @returns Updated mandant
   */
  async updateMandant(id: number, mandant: Partial<InsertMandant>): Promise<Mandant> {
    try {
      // Use Portal-DB for consistency with other mandant operations
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      if (mandant.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(mandant.name);
      }
      if (mandant.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(mandant.description);
      }
      if (mandant.category !== undefined) {
        updateFields.push(`category = $${paramIndex++}`);
        values.push(mandant.category);
      }
      if (mandant.info !== undefined) {
        updateFields.push(`info = $${paramIndex++}`);
        values.push(JSON.stringify(mandant.info));
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id); // Add ID as last parameter
      const query = `UPDATE mandants SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, description, category, info, created_at`;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error(`Mandant with ID ${id} not found`);
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        category: row.category,
        info: row.info || {},
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error updating mandant in Portal-DB:', error);
      // Fallback to development DB
      const [updatedMandant] = await getDb()
        .update(mandants)
        .set(mandant)
        .where(eq(mandants.id, id))
        .returning();
      return updatedMandant;
    }
  }

  /**
   * Delete mandant
   *
   * @param id - Mandant ID to delete
   */
  async deleteMandant(id: number): Promise<void> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      await pool.query('DELETE FROM mandants WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting mandant from Portal-DB:', error);
      // Fallback to development DB
      await getDb().delete(mandants).where(eq(mandants.id, id));
    }
  }
}

// Singleton instance
export const usersRepository = new UsersRepository();
