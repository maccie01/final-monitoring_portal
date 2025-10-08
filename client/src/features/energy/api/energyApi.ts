/**
 * Energy API Client
 *
 * Handles all energy-related API calls including:
 * - Energy data management
 * - Heating systems
 * - Efficiency analysis
 * - Energy balance calculations
 */

import { apiClient } from '@/lib/apiClient';

export interface EnergyDataRecord {
  id?: number;
  systemId: number;
  recordDate: string;
  energyConsumption?: number;
  renewableShare?: number;
  co2Emissions?: number;
  cost?: number;
  temperature?: number;
  humidity?: number;
}

export interface HeatingSystem {
  id: number;
  name: string;
  type?: string;
  location?: string;
  status?: string;
}

export interface EfficiencyAnalysisResult {
  objectId: number;
  name: string;
  address: string;
  area: number;
  verbrauch: number;
  efficiencyPerM2: number;
  efficiencyClass: string;
  color: string;
}

export interface EnergyBalanceData {
  timeRange: string;
  totalConsumption: number;
  totalProduction?: number;
  balance: number;
  periods: Array<{
    date: string;
    consumption: number;
    production?: number;
  }>;
}

export const energyApi = {
  /**
   * Get all heating systems
   */
  async getHeatingSystems(): Promise<HeatingSystem[]> {
    return apiClient.get('/api/heating-systems');
  },

  /**
   * Get energy data for a specific system
   */
  async getEnergyData(
    systemId: number,
    startDate?: string,
    endDate?: string
  ): Promise<EnergyDataRecord[]> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return apiClient.get(`/api/energy-data?systemId=${systemId}`, params);
  },

  /**
   * Create new energy data record
   */
  async createEnergyData(data: EnergyDataRecord): Promise<EnergyDataRecord> {
    return apiClient.post('/api/energy-data', data);
  },

  /**
   * Update energy data record
   */
  async updateEnergyData(id: number, data: Partial<EnergyDataRecord>): Promise<EnergyDataRecord> {
    return apiClient.put(`/api/energy-data/${id}`, data);
  },

  /**
   * Delete energy data record
   */
  async deleteEnergyData(id: number): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/energy-data/${id}`);
  },

  /**
   * Get efficiency analysis for an object
   */
  async getEfficiencyAnalysis(
    objectId: number,
    timeRange: 'last-year' | 'last-365-days' | 'last-2year' = 'last-year',
    resolution: 'daily' | 'monthly' = 'monthly'
  ): Promise<EfficiencyAnalysisResult> {
    return apiClient.get(`/api/test-efficiency-analysis/${objectId}`, {
      timeRange,
      resolution
    });
  },

  /**
   * Get energy balance for an object
   */
  async getEnergyBalance(
    objectId: number,
    timeRange: string
  ): Promise<EnergyBalanceData> {
    return apiClient.post(`/api/energy-balance/${objectId}`, { timeRange });
  },

  /**
   * Get dbEnergyData configuration
   */
  async getDbEnergyDataConfig(): Promise<any> {
    return apiClient.get('/api/settings/dbEnergyData_view_day_comp');
  },
};
