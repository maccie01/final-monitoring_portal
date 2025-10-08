/**
 * Monitoring API Client
 *
 * Handles all monitoring-related API calls including:
 * - System health/status (dashboard KPIs, critical systems, alerts)
 * - Network monitoring (temperature data, thresholds, consumption)
 * - Performance metrics
 * - Map/location data
 */

import { apiClient } from '@/lib/apiClient';

/**
 * Dashboard & System Health
 */
export const monitoringApi = {
  /**
   * Get dashboard KPIs
   */
  async getDashboardKPIs(): Promise<any> {
    return apiClient.get('/api/dashboard/kpis');
  },

  /**
   * Get critical systems overview
   */
  async getCriticalSystems(): Promise<any> {
    return apiClient.get('/api/dashboard/critical-systems');
  },

  /**
   * Get system alerts
   */
  async getSystemAlerts(): Promise<any> {
    return apiClient.get('/api/system-alerts');
  },

  /**
   * Get temperature thresholds
   */
  async getTemperatureThresholds(): Promise<any> {
    return apiClient.get('/api/settings/thresholds');
  },

  /**
   * Network Monitoring - Consumption Data
   */

  /**
   * Get daily consumption for an object
   */
  async getDailyConsumption(objectId: number): Promise<any> {
    const response = await fetch(`/api/public-daily-consumption/${objectId}`);
    if (!response.ok) throw new Error('Failed to fetch daily consumption');
    return response.json();
  },

  /**
   * Get monthly consumption for an object
   */
  async getMonthlyConsumption(objectId: number, timeRange?: string): Promise<any> {
    const url = timeRange
      ? `/api/public-monthly-consumption/${objectId}?timeRange=${timeRange}`
      : `/api/public-monthly-consumption/${objectId}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Monthly consumption API not available, using empty data');
      return {};
    }
    return response.json();
  },

  /**
   * Get multi-year monthly consumption for an object
   */
  async getMultiYearConsumption(objectId: number): Promise<any> {
    try {
      const [current, lastYear, yearBefore] = await Promise.all([
        fetch(`/api/public-monthly-consumption/${objectId}?timeRange=last-365-days`).then(r => r.ok ? r.json() : null),
        fetch(`/api/public-monthly-consumption/${objectId}?timeRange=last-year`).then(r => r.ok ? r.json() : null),
        fetch(`/api/public-monthly-consumption/${objectId}?timeRange=year-before-last`).then(r => r.ok ? r.json() : null)
      ]);

      return {
        'last-365-days': current || {},
        'last-year': lastYear || {},
        'year-before-last': yearBefore || {}
      };
    } catch (error) {
      console.warn('Multi-year consumption API failed:', error);
      return {
        'last-365-days': {},
        'last-year': {},
        'year-before-last': {}
      };
    }
  },

  /**
   * Performance Testing - Efficiency Analysis
   */

  /**
   * Test efficiency analysis for an object
   */
  async testEfficiencyAnalysis(objectId: number, timeRange: string, resolution: string): Promise<any> {
    const response = await fetch(`/api/test-efficiency-analysis/${objectId}?timeRange=${timeRange}&resolution=${resolution}`);
    if (!response.ok) throw new Error('Failed to fetch efficiency analysis');
    return response.json();
  },

  /**
   * Map & Location Data
   */

  /**
   * Update GPS coordinates for an object
   */
  async updateObjectCoordinates(objectId: number, latitude: number, longitude: number): Promise<any> {
    const response = await fetch(`/api/objects/${objectId}/coordinates`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      throw new Error('Failed to update coordinates');
    }

    return response.json();
  },

  /**
   * Get Grafana settings
   */
  async getGrafanaSettings(): Promise<any> {
    const response = await fetch('/api/settings?category=grafana');
    if (!response.ok) throw new Error('Failed to fetch Grafana settings');
    return response.json();
  },

  /**
   * Get object by objectid
   */
  async getObjectByObjectId(objectId: number): Promise<any> {
    return apiClient.get(`/api/objects/by-objectid?objectid=${objectId}`);
  },
};
