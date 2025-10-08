/**
 * Settings API Client
 *
 * Handles all settings-related API calls including:
 * - System settings CRUD
 * - Threshold configurations
 * - Grafana settings
 * - Energy data settings
 * - Database management
 * - API configuration
 */

import { apiClient } from '@/lib/apiClient';

export interface ThresholdConfig {
  id?: number;
  category: string;
  key_name: string;
  value: {
    label: string;
    enabled: boolean;
    showTemp: boolean;
    thresholds: {
      normal: {
        color: string;
        label: string;
        vlValue: number;
        rlValue: number;
      };
      warning: {
        color: string;
        label: string;
        vlValue: number;
        rlValue: number;
      };
      critical: {
        color: string;
        label: string;
        vlValue: number;
        rlValue: number;
      };
    };
  };
  userId?: string;
  mandantId?: string;
}

export interface GrafanaConfig {
  id?: number;
  category: string;
  key_name: string;
  value: any;
  userId?: string;
  mandantId?: string;
}

export interface EnergyDataConfig {
  id?: number;
  category: string;
  key_name: string;
  value: {
    dbEnergyData: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
      ssl?: boolean;
      schema?: string;
      connectionTimeout?: number;
    };
  };
  userId?: string;
  mandantId?: string;
}

export interface SettingConfig {
  id?: number;
  category: string;
  key_name: string;
  value: any;
  userId?: string;
  mandantId?: string;
}

export interface DatabaseInfo {
  host: string;
  port: number;
  database: string;
  username: string;
  connected: boolean;
  version?: string;
}

export interface DatabaseStatus {
  connected: boolean;
  database: string;
  version?: string;
  uptime?: number;
}

export interface PerformanceTestResult {
  success: boolean;
  duration: number;
  metrics?: {
    queryTime: number;
    rowCount: number;
  };
}

export const settingsApi = {
  /**
   * Get all settings (optionally filtered by category)
   */
  async getSettings(category?: string): Promise<SettingConfig[]> {
    const url = category ? `/api/settings?category=${category}` : '/api/settings';
    return apiClient.get(url);
  },

  /**
   * Get threshold configurations
   */
  async getThresholds(): Promise<ThresholdConfig[]> {
    return apiClient.get('/api/settings/thresholds');
  },

  /**
   * Get Grafana settings
   */
  async getGrafanaSettings(): Promise<GrafanaConfig[]> {
    return apiClient.get('/api/settings?category=grafana');
  },

  /**
   * Get energy data settings
   */
  async getEnergyDataSettings(): Promise<EnergyDataConfig[]> {
    return apiClient.get('/api/settings?category=data');
  },

  /**
   * Create new setting
   */
  async createSetting(data: SettingConfig): Promise<SettingConfig> {
    return apiClient.post('/api/settings', data);
  },

  /**
   * Update existing setting
   */
  async updateSetting(id: number, data: Partial<SettingConfig>): Promise<SettingConfig> {
    return apiClient.put(`/api/settings/${id}`, data);
  },

  /**
   * Delete setting
   */
  async deleteSetting(id: number): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/settings/${id}`);
  },

  /**
   * Delete setting by category and key name
   */
  async deleteSettingByKey(category: string, keyName: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/settings/${category}/${keyName}`);
  },

  /**
   * Get database connection info
   */
  async getDatabaseInfo(): Promise<DatabaseInfo> {
    return apiClient.get('/api/database/info');
  },

  /**
   * Get database status
   */
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    return apiClient.get('/api/database/status');
  },

  /**
   * Run database performance test
   */
  async runPerformanceTest(): Promise<PerformanceTestResult> {
    return apiClient.post('/api/database/performance-test', {});
  },

  /**
   * Get setup configuration
   */
  async getSetupConfig(): Promise<any> {
    return apiClient.get('/api/setup-config');
  },

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<any> {
    return apiClient.get('/api/health');
  },

  /**
   * Get system status
   */
  async getStatus(): Promise<any> {
    return apiClient.get('/api/status');
  },
};
