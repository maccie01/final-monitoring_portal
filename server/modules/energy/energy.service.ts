import { energyRepository } from "./energy.repository";
import type {
  DayComp,
  InsertDayComp,
} from "@shared/schema";
import type {
  EnergyDataFilters,
  DailyConsumptionResponse,
} from "./energy.types";

/**
 * Energy Service
 *
 * Business logic layer for energy operations.
 * Handles energy data validation, date range calculations, and delegates CRUD to repository.
 */

export class EnergyService {
  // ============================================================================
  // DAY COMP DATA OPERATIONS
  // ============================================================================

  /**
   * Get day compensation data with validation
   * @param objectId - Object ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Array of DayComp records
   */
  async getDayCompData(objectId: number, startDate?: Date, endDate?: Date): Promise<DayComp[]> {
    // Validate date range if provided
    if (startDate && endDate) {
      this.validateDateRange(startDate, endDate);
    }

    return await energyRepository.getDayCompData(objectId, startDate, endDate);
  }

  /**
   * Create new day compensation data
   * @param data - Day compensation data to create
   * @returns Created DayComp record
   */
  async createDayCompData(data: InsertDayComp): Promise<DayComp> {
    // Validate required fields
    if (!data.log) {
      throw new Error('Object ID (log) is required');
    }

    if (!data.time) {
      throw new Error('Time is required');
    }

    return await energyRepository.createDayCompData(data);
  }

  /**
   * Get latest day compensation data
   * @param objectId - Object ID
   * @returns Latest DayComp record or null
   */
  async getLatestDayCompData(objectId: number): Promise<DayComp | null> {
    const data = await energyRepository.getLatestDayCompData(objectId);
    return data || null;
  }

  // ============================================================================
  // LEGACY DAY METER DATA METHODS
  // ============================================================================

  /**
   * Legacy method: Get day meter data
   * @deprecated Use getDayCompData instead
   */
  async getDayMeterData(objectId: number, startDate?: Date, endDate?: Date): Promise<DayComp[]> {
    return this.getDayCompData(objectId, startDate, endDate);
  }

  /**
   * Legacy method: Create day meter data
   * @deprecated Use createDayCompData instead
   */
  async createDayMeterData(data: InsertDayComp): Promise<DayComp> {
    return this.createDayCompData(data);
  }

  /**
   * Legacy method: Get latest day meter data
   * @deprecated Use getLatestDayCompData instead
   */
  async getLatestDayMeterData(objectId: number): Promise<DayComp | null> {
    return this.getLatestDayCompData(objectId);
  }

  // ============================================================================
  // DAILY CONSUMPTION OPERATIONS
  // ============================================================================

  /**
   * Get daily consumption statistics
   * @param objectId - Object ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Array of daily consumption data
   */
  async getDailyConsumption(objectId: number, startDate?: Date, endDate?: Date): Promise<DailyConsumptionResponse[]> {
    // Validate date range if provided
    if (startDate && endDate) {
      this.validateDateRange(startDate, endDate);
    }

    return await energyRepository.getDailyConsumption(objectId, startDate, endDate);
  }

  // ============================================================================
  // EXTERNAL ENERGY DATA OPERATIONS
  // ============================================================================

  /**
   * Get external energy data from view_mon_comp
   * @param objectId - Object ID
   * @param limit - Maximum number of records (default 12)
   * @returns Array of energy data
   */
  async getEnergyDataExternal(objectId: number, limit?: number): Promise<any[]> {
    // Validate limit
    const validatedLimit = this.validateLimit(limit || 12);

    return await energyRepository.getEnergyDataExternal(objectId, validatedLimit);
  }

  /**
   * Get energy data for all meters of an object
   * @param objectId - Object ID
   * @param meterData - Meter configuration
   * @param timeRange - Time range filter
   * @returns Object with energy data per meter
   */
  async getEnergyDataForAllMeters(objectId: number, meterData: Record<string, any>, timeRange?: string): Promise<any> {
    // Validate meter data
    if (!meterData || Object.keys(meterData).length === 0) {
      throw new Error('Meter data is required');
    }

    // Validate time range if provided
    if (timeRange) {
      this.validateTimeRange(timeRange);
    }

    return await energyRepository.getEnergyDataForAllMeters(objectId, meterData, timeRange);
  }

  /**
   * Get energy data for a specific meter
   * @param meterId - Meter ID
   * @param objectId - Object ID for context
   * @param fromDate - Optional start date
   * @param toDate - Optional end date
   * @returns Array of energy data for the meter
   */
  async getEnergyDataForSpecificMeter(meterId: number, objectId: number, fromDate?: Date | null, toDate?: Date | null): Promise<any[]> {
    // Validate date range if both provided
    if (fromDate && toDate) {
      this.validateDateRange(fromDate, toDate);
    }

    return await energyRepository.getEnergyDataForSpecificMeter(meterId, objectId, fromDate, toDate);
  }

  /**
   * Get energy data for an object with flexible filtering
   * @param objectId - Object ID
   * @param startDate - Optional start date string
   * @param endDate - Optional end date string
   * @param timeRange - Optional time range filter
   * @returns Array of energy records
   */
  async getEnergyDataForObject(objectId: number, startDate?: string, endDate?: string, timeRange?: string): Promise<any[]> {
    // Validate date strings if provided
    if (startDate) {
      this.validateDateString(startDate);
    }
    if (endDate) {
      this.validateDateString(endDate);
    }

    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      this.validateDateRange(start, end);
    }

    // Validate time range if provided
    if (timeRange) {
      this.validateTimeRange(timeRange);
    }

    return await energyRepository.getEnergyDataForObject(objectId, startDate, endDate, timeRange);
  }

  /**
   * Get daily consumption data grouped by meter
   * @param objectId - Object ID
   * @param timeRange - Time range filter
   * @returns Object with daily consumption per meter
   */
  async getDailyConsumptionData(objectId: number, timeRange: string): Promise<any> {
    // Validate time range
    this.validateTimeRangeForConsumption(timeRange);

    return await energyRepository.getDailyConsumptionData(objectId, timeRange);
  }

  // ============================================================================
  // VALIDATION HELPER METHODS
  // ============================================================================

  /**
   * Validate date range
   * Ensures start date is before end date and dates are valid
   * @param startDate - Start date
   * @param endDate - End date
   * @throws Error if validation fails
   */
  private validateDateRange(startDate: Date, endDate: Date): void {
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('Invalid end date');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    // Check if date range is reasonable (not more than 10 years)
    const maxRangeMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      throw new Error('Date range cannot exceed 10 years');
    }
  }

  /**
   * Validate date string format
   * @param dateString - Date string to validate
   * @throws Error if invalid
   */
  private validateDateString(dateString: string): void {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string format');
    }
  }

  /**
   * Validate limit parameter
   * @param limit - Limit value to validate
   * @returns Validated limit
   * @throws Error if invalid
   */
  private validateLimit(limit: number): number {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error('Limit must be a positive integer');
    }

    if (limit > 1000) {
      throw new Error('Limit cannot exceed 1000');
    }

    return limit;
  }

  /**
   * Validate time range format
   * @param timeRange - Time range string to validate
   * @throws Error if invalid
   */
  private validateTimeRange(timeRange: string): void {
    const validRanges = [
      '1d', '7d', '30d',
      'now-1y', 'now-2y', 'now-365d',
      'now-1y/y', 'now-2y/y'
    ];

    if (!validRanges.includes(timeRange)) {
      throw new Error(`Invalid time range. Must be one of: ${validRanges.join(', ')}`);
    }
  }

  /**
   * Validate time range for consumption data
   * @param timeRange - Time range string to validate
   * @throws Error if invalid
   */
  private validateTimeRangeForConsumption(timeRange: string): void {
    const validRanges = [
      '2023', '2024', '2025',
      'last-year', 'year-before-last',
      'last-30-days', 'last-90-days', 'last-365-days',
      'multi-year'
    ];

    if (!validRanges.includes(timeRange)) {
      throw new Error(`Invalid time range for consumption. Must be one of: ${validRanges.join(', ')}`);
    }
  }

  // ============================================================================
  // ENERGY METRICS CALCULATIONS (optional business logic)
  // ============================================================================

  /**
   * Calculate energy metrics from raw data
   * @param data - Array of DayComp records
   * @returns Calculated metrics
   */
  calculateEnergyMetrics(data: DayComp[]): {
    totalConsumption: number;
    averageConsumption: number;
    maxDailyConsumption: number;
    minDailyConsumption: number;
    averageTemperature: number;
  } {
    if (!data || data.length === 0) {
      return {
        totalConsumption: 0,
        averageConsumption: 0,
        maxDailyConsumption: 0,
        minDailyConsumption: 0,
        averageTemperature: 0,
      };
    }

    let totalConsumption = 0;
    let maxConsumption = -Infinity;
    let minConsumption = Infinity;
    let totalTemp = 0;
    let validTempCount = 0;

    data.forEach(record => {
      const dailyConsumption = (record.enLast || 0) - (record.enFirst || 0);
      totalConsumption += dailyConsumption;
      maxConsumption = Math.max(maxConsumption, dailyConsumption);
      minConsumption = Math.min(minConsumption, dailyConsumption);

      const avgTemp = ((record.fltMean || 0) + (record.retMean || 0)) / 2;
      if (avgTemp > 0) {
        totalTemp += avgTemp;
        validTempCount++;
      }
    });

    return {
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      averageConsumption: Math.round((totalConsumption / data.length) * 100) / 100,
      maxDailyConsumption: Math.round(maxConsumption * 100) / 100,
      minDailyConsumption: Math.round(minConsumption * 100) / 100,
      averageTemperature: validTempCount > 0 ? Math.round((totalTemp / validTempCount) * 10) / 10 : 0,
    };
  }
}

// Singleton instance
export const energyService = new EnergyService();
