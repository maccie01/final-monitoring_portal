import type { Settings, InsertSettings } from "@shared/schema";

/**
 * Settings Module Types
 *
 * This module handles settings-related types including application settings,
 * user preferences, and system configurations.
 */

// Re-export shared types
export type {
  Settings,
  InsertSettings,
};

// Settings data filters for query operations
export interface SettingsFilters {
  category?: string;
  keyName?: string;
  userId?: string;
  mandantId?: number;
}

// API Response types
export interface SettingResponse {
  id: number;
  category: string;
  keyName: string;
  value: any;
  userId?: string | null;
  mandantId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettingsListResponse {
  settings: SettingResponse[];
  total: number;
  filters?: SettingsFilters;
}
