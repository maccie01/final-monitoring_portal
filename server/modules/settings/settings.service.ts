import { settingsRepository } from "./settings.repository";
import type { Settings, InsertSettings } from "@shared/schema";
import type { SettingsFilters } from "./settings.types";

/**
 * Settings Service
 *
 * Business logic layer for settings operations.
 * Handles settings validation, business rules, and delegates CRUD to repository.
 */

export class SettingsService {
  // ============================================================================
  // SETTINGS OPERATIONS
  // ============================================================================

  /**
   * Get settings with validation
   * @param filters - Optional filters for category, userId, mandantId
   * @returns Array of Settings records
   */
  async getSettings(filters?: {
    category?: string;
    user_id?: string;
    mandant_id?: number;
  }): Promise<Settings[]> {
    // Validate category if provided
    if (filters?.category) {
      this.validateSettingCategory(filters.category);
    }

    // Validate user_id if provided
    if (filters?.user_id) {
      this.validateUserId(filters.user_id);
    }

    // Validate mandant_id if provided
    if (filters?.mandant_id) {
      this.validateMandantId(filters.mandant_id);
    }

    return await settingsRepository.getSettings(filters);
  }

  /**
   * Get single setting by category and key name
   * @param category - Setting category
   * @param keyName - Setting key name
   * @param userId - Optional user ID
   * @param mandantId - Optional mandant ID
   * @returns Settings record or null
   */
  async getSetting(
    category: string,
    keyName: string,
    userId?: string,
    mandantId?: number
  ): Promise<Settings | null> {
    // Validate inputs
    this.validateSettingCategory(category);
    this.validateSettingKey(keyName);

    if (userId) {
      this.validateUserId(userId);
    }

    if (mandantId) {
      this.validateMandantId(mandantId);
    }

    const data = await settingsRepository.getSetting(category, keyName, userId, mandantId);
    return data || null;
  }

  /**
   * Get single setting by ID
   * @param id - Setting ID
   * @returns Settings record or null
   */
  async getSettingById(id: number): Promise<Settings | null> {
    this.validateSettingId(id);

    const data = await settingsRepository.getSettingById(id);
    return data || null;
  }

  /**
   * Create new setting
   * @param settingData - Setting data to create
   * @returns Created Settings record
   */
  async createSetting(settingData: InsertSettings): Promise<Settings> {
    // Validate required fields
    this.validateSettingData(settingData);

    return await settingsRepository.createSetting(settingData);
  }

  /**
   * Update existing setting
   * @param id - Setting ID
   * @param settingData - Partial setting data to update
   * @returns Updated Settings record
   */
  async updateSetting(id: number, settingData: Partial<InsertSettings>): Promise<Settings> {
    // Validate setting ID
    this.validateSettingId(id);

    // Validate setting data if provided
    if (Object.keys(settingData).length > 0) {
      this.validatePartialSettingData(settingData);
    }

    return await settingsRepository.updateSetting(id, settingData);
  }

  /**
   * Delete setting
   * @param id - Setting ID
   */
  async deleteSetting(id: number): Promise<void> {
    this.validateSettingId(id);

    await settingsRepository.deleteSetting(id);
  }

  /**
   * Clear all settings (admin only)
   * @returns Array of deleted Settings records
   */
  async clearSettings(): Promise<Settings[]> {
    return await settingsRepository.clearSettings();
  }

  // ============================================================================
  // VALIDATION HELPER METHODS
  // ============================================================================

  /**
   * Validate setting category
   * @param category - Category to validate
   * @throws Error if invalid
   */
  private validateSettingCategory(category: string): void {
    if (!category || typeof category !== 'string') {
      throw new Error('Category is required and must be a string');
    }

    if (category.length > 100) {
      throw new Error('Category must not exceed 100 characters');
    }

    // Category should not contain special characters except underscores and hyphens
    const categoryRegex = /^[a-zA-Z0-9_-]+$/;
    if (!categoryRegex.test(category)) {
      throw new Error('Category must contain only alphanumeric characters, underscores, and hyphens');
    }
  }

  /**
   * Validate setting key name
   * @param keyName - Key name to validate
   * @throws Error if invalid
   */
  private validateSettingKey(keyName: string): void {
    if (!keyName || typeof keyName !== 'string') {
      throw new Error('Key name is required and must be a string');
    }

    if (keyName.length > 255) {
      throw new Error('Key name must not exceed 255 characters');
    }

    // Key name should not contain special characters except underscores, hyphens, and dots
    const keyRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!keyRegex.test(keyName)) {
      throw new Error('Key name must contain only alphanumeric characters, underscores, hyphens, and dots');
    }
  }

  /**
   * Validate user ID format
   * @param userId - User ID to validate
   * @throws Error if invalid
   */
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new Error('User ID must be a non-empty string');
    }

    if (userId.length > 255) {
      throw new Error('User ID must not exceed 255 characters');
    }
  }

  /**
   * Validate mandant ID
   * @param mandantId - Mandant ID to validate
   * @throws Error if invalid
   */
  private validateMandantId(mandantId: number): void {
    if (!Number.isInteger(mandantId) || mandantId <= 0) {
      throw new Error('Mandant ID must be a positive integer');
    }
  }

  /**
   * Validate setting ID
   * @param id - Setting ID to validate
   * @throws Error if invalid
   */
  private validateSettingId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Setting ID must be a positive integer');
    }
  }

  /**
   * Validate setting data for creation
   * @param settingData - Setting data to validate
   * @throws Error if validation fails
   */
  private validateSettingData(settingData: InsertSettings): void {
    // Validate required fields
    if (!settingData.category) {
      throw new Error('Category is required');
    }

    if (!settingData.key_name) {
      throw new Error('Key name is required');
    }

    if (settingData.value === undefined || settingData.value === null) {
      throw new Error('Value is required');
    }

    // Validate individual fields
    this.validateSettingCategory(settingData.category);
    this.validateSettingKey(settingData.key_name);

    // Validate optional fields
    if (settingData.user_id) {
      this.validateUserId(settingData.user_id);
    }

    if (settingData.mandant_id) {
      this.validateMandantId(settingData.mandant_id);
    }

    // Validate value is valid JSON-serializable
    try {
      JSON.stringify(settingData.value);
    } catch (error) {
      throw new Error('Setting value must be JSON-serializable');
    }
  }

  /**
   * Validate partial setting data for updates
   * @param settingData - Partial setting data to validate
   * @throws Error if validation fails
   */
  private validatePartialSettingData(settingData: Partial<InsertSettings>): void {
    // Validate category if provided
    if (settingData.category !== undefined) {
      this.validateSettingCategory(settingData.category);
    }

    // Validate key_name if provided
    if (settingData.key_name !== undefined) {
      this.validateSettingKey(settingData.key_name);
    }

    // Validate user_id if provided
    if (settingData.user_id !== undefined && settingData.user_id !== null) {
      this.validateUserId(settingData.user_id);
    }

    // Validate mandant_id if provided
    if (settingData.mandant_id !== undefined && settingData.mandant_id !== null) {
      this.validateMandantId(settingData.mandant_id);
    }

    // Validate value if provided
    if (settingData.value !== undefined) {
      try {
        JSON.stringify(settingData.value);
      } catch (error) {
        throw new Error('Setting value must be JSON-serializable');
      }
    }
  }
}

// Singleton instance
export const settingsService = new SettingsService();
