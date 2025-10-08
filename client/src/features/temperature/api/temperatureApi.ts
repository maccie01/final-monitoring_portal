/**
 * Temperature API Client
 *
 * Handles all temperature-related API calls including:
 * - Temperature efficiency analysis
 * - Outdoor temperature data
 * - Temperature-based efficiency calculations
 */

import { apiClient } from '@/lib/apiClient';

export interface OutdoorTemperature {
  id: number;
  date: string;
  postalCode: string;
  city: string;
  temperatureMin: number;
  temperatureMax: number;
  temperatureMean: number;
  dataSource: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemperatureEfficiencyData {
  objectId: number;
  timeRange: string;
  resolution: string;
  meterId: number;
  meterKey: string;
  area: number;
  period: {
    days: number;
    totalKwh: number;
    startDate: string;
    endDate: string;
    en_first: number;
    en_last: number;
    en_first_Date: string;
    en_last_Date: string;
  };
  monthlyData?: Array<{
    month: string;
    monthlyKwh: number;
    monthlyWh: number;
    efficiencyPerM2: number;
    days: number;
    en_first: number;
    en_last: number;
    startDate: string;
    endDate: string;
  }>;
  summary: {
    daily: { totalKwh: number; avgKwh: number; efficiencyPerM2: number };
    weekly: { avgKwh: number; efficiencyPerM2: number };
    monthly: { avgKwh: number; efficiencyPerM2: number };
    yearly: { totalKwh: number; avgKwh: number; efficiencyPerM2: number };
  };
}

export const temperatureApi = {
  /**
   * Get temperature efficiency chart data for an object
   */
  async getTemperatureEfficiencyChart(
    objectId: number,
    timeRange: 'last-year' | 'last-365-days' | 'last-2year' = 'last-year'
  ): Promise<TemperatureEfficiencyData> {
    return apiClient.get(`/api/energy-data/temperature-efficiency-chart/${objectId}`, {
      timeRange
    });
  },

  /**
   * Get outdoor temperature data for a location
   */
  async getOutdoorTemperature(
    postalCode: string,
    startDate?: string,
    endDate?: string
  ): Promise<OutdoorTemperature[]> {
    const params: Record<string, string> = { postalCode };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return apiClient.get('/api/outdoor-temperature', params);
  },

  /**
   * Get temperature analysis for an object
   */
  async getTemperatureAnalysis(
    objectId: number,
    timeRange: 'last-year' | 'last-365-days' | 'last-2year' = 'last-year'
  ): Promise<any> {
    return apiClient.get(`/api/temperature-analysis/${objectId}`, {
      timeRange
    });
  },
};
