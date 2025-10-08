import { ConnectionPoolManager } from "../../connection-pool";
import type { Settings, InsertSettings } from "@shared/schema";
import type { SettingsFilters } from "./settings.types";

/**
 * Settings Repository
 *
 * Data access layer for settings operations.
 * Handles direct database queries for application settings, user preferences, and system configurations.
 * Uses Portal-DB via ConnectionPoolManager.
 */

export class SettingsRepository {
  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Get settings with optional filtering
   * Uses Portal-DB via ConnectionPoolManager
   * @param filters - Optional filters for category, userId, mandantId
   * @returns Array of Settings records
   */
  async getSettings(filters?: {
    category?: string;
    user_id?: string;
    mandant_id?: number;
  }): Promise<Settings[]> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();

      let query = `SELECT * FROM settings WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(filters.category);
      }
      if (filters?.user_id) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filters.user_id);
      }
      if (filters?.mandant_id) {
        query += ` AND mandant_id = $${paramIndex++}`;
        params.push(filters.mandant_id);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Error fetching settings from active settingdb:', error);
      return [];
    }
  }

  /**
   * Get a single setting by category, key_name, and optional user_id/mandant_id
   * @param category - Setting category
   * @param key_name - Setting key name
   * @param user_id - Optional user ID
   * @param mandant_id - Optional mandant ID
   * @returns Settings record or undefined
   */
  async getSetting(
    category: string,
    key_name: string,
    user_id?: string,
    mandant_id?: number
  ): Promise<Settings | undefined> {
    try {
      const pool = ConnectionPoolManager.getInstance().getPool();
      let query = `SELECT * FROM settings WHERE category = $1 AND key_name = $2`;
      const params: any[] = [category, key_name];

      if (user_id) {
        query += ` AND user_id = $${params.length + 1}`;
        params.push(user_id);
      }
      if (mandant_id) {
        query += ` AND mandant_id = $${params.length + 1}`;
        params.push(mandant_id);
      }

      query += ` ORDER BY created_at DESC LIMIT 1`;
      const result = await pool.query(query, params);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error(`❌ Error fetching setting ${category}/${key_name}:`, error);
      return undefined;
    }
  }

  /**
   * Get a single setting by ID
   * @param id - Setting ID
   * @returns Settings record or undefined
   */
  async getSettingById(id: number): Promise<Settings | undefined> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(`SELECT * FROM settings WHERE id = $1 LIMIT 1`, [id]);
      return result.rows.length > 0 ? result.rows[0] : undefined;
    } catch (error) {
      console.error(`❌ Error fetching setting by ID ${id} from active settingdb:`, error);
      return undefined;
    }
  }

  /**
   * Create new setting
   * @param settingData - Setting data to insert
   * @returns Created Settings record
   */
  async createSetting(settingData: InsertSettings): Promise<Settings> {
    try {
      const pool = ConnectionPoolManager.getInstance().getPool();
      const query = `
        INSERT INTO settings (category, key_name, value, user_id, mandant_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;
      const result = await pool.query(query, [
        settingData.category,
        settingData.key_name,
        settingData.value,
        settingData.user_id || null,
        settingData.mandant_id || null
      ]);
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error creating setting:`, error);
      throw error;
    }
  }

  /**
   * Update existing setting
   * @param id - Setting ID
   * @param settingData - Partial setting data to update
   * @returns Updated Settings record
   */
  async updateSetting(id: number, settingData: Partial<InsertSettings>): Promise<Settings> {
    try {
      const pool = ConnectionPoolManager.getInstance().getPool();
      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (settingData.category !== undefined) {
        updates.push(`category = $${paramIndex++}`);
        params.push(settingData.category);
      }
      if (settingData.key_name !== undefined) {
        updates.push(`key_name = $${paramIndex++}`);
        params.push(settingData.key_name);
      }
      if (settingData.value !== undefined) {
        updates.push(`value = $${paramIndex++}`);
        params.push(settingData.value);
      }
      if (settingData.user_id !== undefined) {
        updates.push(`user_id = $${paramIndex++}`);
        params.push(settingData.user_id);
      }
      if (settingData.mandant_id !== undefined) {
        updates.push(`mandant_id = $${paramIndex++}`);
        params.push(settingData.mandant_id);
      }

      updates.push(`updated_at = NOW()`);
      params.push(id);

      const query = `
        UPDATE settings SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, params);
      if (result.rows.length === 0) {
        throw new Error(`Setting with ID ${id} not found`);
      }
      return result.rows[0];
    } catch (error) {
      console.error(`❌ Error updating setting ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete setting
   * @param id - Setting ID
   */
  async deleteSetting(id: number): Promise<void> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      await pool.query(`DELETE FROM settings WHERE id = $1`, [id]);
    } catch (error) {
      console.error(`❌ Error deleting setting ID ${id} from active settingdb:`, error);
      throw error;
    }
  }

  /**
   * Clear all settings (returns deleted settings)
   * @returns Array of deleted Settings records
   */
  async clearSettings(): Promise<Settings[]> {
    try {
      const pool = await ConnectionPoolManager.getInstance().getPool();
      const result = await pool.query(`SELECT * FROM settings`);
      const allSettings = result.rows;
      await pool.query(`DELETE FROM settings`);
      return allSettings;
    } catch (error) {
      console.error('❌ Error clearing settings from active settingdb:', error);
      throw error;
    }
  }
}

// Singleton instance
export const settingsRepository = new SettingsRepository();
