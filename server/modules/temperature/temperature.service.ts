import { temperatureRepository } from "./temperature.repository";
import type {
  DailyOutdoorTemperature,
  InsertDailyOutdoorTemperature,
} from "@shared/schema";
import type {
  TemperatureFilters,
  TemperatureEfficiencyData,
} from "./temperature.types";

/**
 * Temperature Service
 *
 * Business logic layer for temperature operations.
 * Handles temperature data validation, date range calculations, and delegates CRUD to repository.
 */

export class TemperatureService {
  // ============================================================================
  // DAILY OUTDOOR TEMPERATURE OPERATIONS
  // ============================================================================

  /**
   * Get daily outdoor temperatures with validation
   * @param postalCode - Optional postal code filter
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @param resolution - Optional resolution filter
   * @returns Array of DailyOutdoorTemperature records
   */
  async getDailyOutdoorTemperatures(
    postalCode?: string,
    startDate?: Date,
    endDate?: Date,
    resolution?: string
  ): Promise<DailyOutdoorTemperature[]> {
    // Validate postal code if provided
    if (postalCode) {
      this.validatePostalCode(postalCode);
    }

    // Validate date range if provided
    if (startDate && endDate) {
      this.validateDateRange(startDate, endDate);
    }

    // Validate resolution if provided
    if (resolution) {
      this.validateResolution(resolution);
    }

    return await temperatureRepository.getDailyOutdoorTemperatures(postalCode, startDate, endDate, resolution);
  }

  /**
   * Get single daily outdoor temperature by ID
   * @param id - Temperature record ID
   * @returns DailyOutdoorTemperature record or null
   */
  async getDailyOutdoorTemperature(id: number): Promise<DailyOutdoorTemperature | null> {
    const data = await temperatureRepository.getDailyOutdoorTemperature(id);
    return data || null;
  }

  /**
   * Create new daily outdoor temperature record
   * @param temperature - Temperature data to create
   * @returns Created DailyOutdoorTemperature record
   */
  async createDailyOutdoorTemperature(temperature: InsertDailyOutdoorTemperature): Promise<DailyOutdoorTemperature> {
    // Validate required fields
    this.validateTemperatureData(temperature);

    return await temperatureRepository.createDailyOutdoorTemperature(temperature);
  }

  /**
   * Update existing daily outdoor temperature record
   * @param id - Temperature record ID
   * @param temperature - Partial temperature data to update
   * @returns Updated DailyOutdoorTemperature record
   */
  async updateDailyOutdoorTemperature(id: number, temperature: Partial<InsertDailyOutdoorTemperature>): Promise<DailyOutdoorTemperature> {
    // Validate temperature data if provided
    if (Object.keys(temperature).length > 0) {
      this.validatePartialTemperatureData(temperature);
    }

    return await temperatureRepository.updateDailyOutdoorTemperature(id, temperature);
  }

  /**
   * Delete daily outdoor temperature record
   * @param id - Temperature record ID
   */
  async deleteDailyOutdoorTemperature(id: number): Promise<void> {
    await temperatureRepository.deleteDailyOutdoorTemperature(id);
  }

  /**
   * Get temperatures by postal code with optional date range
   * @param postalCode - Postal code to filter by
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Array of DailyOutdoorTemperature records
   */
  async getTemperaturesByPostalCode(postalCode: string, startDate?: Date, endDate?: Date): Promise<DailyOutdoorTemperature[]> {
    // Validate postal code
    this.validatePostalCode(postalCode);

    // Validate date range if provided
    if (startDate && endDate) {
      this.validateDateRange(startDate, endDate);
    }

    return await temperatureRepository.getTemperaturesByPostalCode(postalCode, startDate, endDate);
  }

  /**
   * Get latest temperature for a specific postal code
   * @param postalCode - Postal code to query
   * @returns Latest DailyOutdoorTemperature record or null
   */
  async getLatestTemperatureForPostalCode(postalCode: string): Promise<DailyOutdoorTemperature | null> {
    // Validate postal code
    this.validatePostalCode(postalCode);

    const data = await temperatureRepository.getLatestTemperatureForPostalCode(postalCode);
    return data || null;
  }

  /**
   * Get temperatures for postal codes of specified objects
   * @param objectIds - Optional array of object IDs
   * @returns Array of DailyOutdoorTemperature records
   */
  async getTemperaturesForObjectPostalCodes(objectIds?: number[]): Promise<DailyOutdoorTemperature[]> {
    // Validate object IDs if provided
    if (objectIds && objectIds.length > 0) {
      this.validateObjectIds(objectIds);
    }

    return await temperatureRepository.getTemperaturesForObjectPostalCodes(objectIds);
  }

  /**
   * Get temperature efficiency data for an object
   * @param objectId - Object ID
   * @param timeRange - Time range filter
   * @returns Array of temperature efficiency data
   */
  async getTemperatureEfficiencyData(objectId: number, timeRange?: string): Promise<TemperatureEfficiencyData[]> {
    // Validate time range if provided
    if (timeRange) {
      this.validateTimeRangeForEfficiency(timeRange);
    }

    return await temperatureRepository.getTemperatureEfficiencyData(objectId, timeRange || 'last30days');
  }

  // ============================================================================
  // VALIDATION HELPER METHODS
  // ============================================================================

  /**
   * Validate postal code format
   * @param postalCode - Postal code to validate
   * @throws Error if invalid
   */
  private validatePostalCode(postalCode: string): void {
    if (!postalCode || typeof postalCode !== 'string') {
      throw new Error('Postal code is required and must be a string');
    }

    // German postal code format: 5 digits
    const postalCodeRegex = /^\d{5}$/;
    if (!postalCodeRegex.test(postalCode)) {
      throw new Error('Invalid postal code format. Must be 5 digits.');
    }
  }

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
   * Validate resolution parameter
   * @param resolution - Resolution string to validate
   * @throws Error if invalid
   */
  private validateResolution(resolution: string): void {
    const validResolutions = ['d', 'w', 'm']; // daily, weekly, monthly
    if (!validResolutions.includes(resolution)) {
      throw new Error(`Invalid resolution. Must be one of: ${validResolutions.join(', ')}`);
    }
  }

  /**
   * Validate temperature data for creation
   * @param temperature - Temperature data to validate
   * @throws Error if validation fails
   */
  private validateTemperatureData(temperature: InsertDailyOutdoorTemperature): void {
    if (!temperature.date) {
      throw new Error('Date is required');
    }

    if (!temperature.postalCode) {
      throw new Error('Postal code is required');
    }

    this.validatePostalCode(temperature.postalCode);

    // Validate temperature values if provided
    if (temperature.temperatureMin !== undefined && temperature.temperatureMin !== null) {
      const tempMin = parseFloat(temperature.temperatureMin.toString());
      if (isNaN(tempMin) || tempMin < -50 || tempMin > 50) {
        throw new Error('Temperature min must be between -50 and 50 degrees Celsius');
      }
    }

    if (temperature.temperatureMax !== undefined && temperature.temperatureMax !== null) {
      const tempMax = parseFloat(temperature.temperatureMax.toString());
      if (isNaN(tempMax) || tempMax < -50 || tempMax > 50) {
        throw new Error('Temperature max must be between -50 and 50 degrees Celsius');
      }
    }

    if (temperature.temperatureMean !== undefined && temperature.temperatureMean !== null) {
      const tempMean = parseFloat(temperature.temperatureMean.toString());
      if (isNaN(tempMean) || tempMean < -50 || tempMean > 50) {
        throw new Error('Temperature mean must be between -50 and 50 degrees Celsius');
      }
    }

    // Validate min <= mean <= max if all are provided
    if (temperature.temperatureMin && temperature.temperatureMax && temperature.temperatureMean) {
      const min = parseFloat(temperature.temperatureMin.toString());
      const max = parseFloat(temperature.temperatureMax.toString());
      const mean = parseFloat(temperature.temperatureMean.toString());

      if (min > mean || mean > max) {
        throw new Error('Temperature values must satisfy: min <= mean <= max');
      }
    }
  }

  /**
   * Validate partial temperature data for updates
   * @param temperature - Partial temperature data to validate
   * @throws Error if validation fails
   */
  private validatePartialTemperatureData(temperature: Partial<InsertDailyOutdoorTemperature>): void {
    if (temperature.postalCode) {
      this.validatePostalCode(temperature.postalCode);
    }

    // Validate temperature values if provided
    if (temperature.temperatureMin !== undefined && temperature.temperatureMin !== null) {
      const tempMin = parseFloat(temperature.temperatureMin.toString());
      if (isNaN(tempMin) || tempMin < -50 || tempMin > 50) {
        throw new Error('Temperature min must be between -50 and 50 degrees Celsius');
      }
    }

    if (temperature.temperatureMax !== undefined && temperature.temperatureMax !== null) {
      const tempMax = parseFloat(temperature.temperatureMax.toString());
      if (isNaN(tempMax) || tempMax < -50 || tempMax > 50) {
        throw new Error('Temperature max must be between -50 and 50 degrees Celsius');
      }
    }

    if (temperature.temperatureMean !== undefined && temperature.temperatureMean !== null) {
      const tempMean = parseFloat(temperature.temperatureMean.toString());
      if (isNaN(tempMean) || tempMean < -50 || tempMean > 50) {
        throw new Error('Temperature mean must be between -50 and 50 degrees Celsius');
      }
    }
  }

  /**
   * Validate object IDs array
   * @param objectIds - Array of object IDs to validate
   * @throws Error if invalid
   */
  private validateObjectIds(objectIds: number[]): void {
    if (!Array.isArray(objectIds)) {
      throw new Error('Object IDs must be an array');
    }

    if (objectIds.some(id => !Number.isInteger(id) || id <= 0)) {
      throw new Error('All object IDs must be positive integers');
    }

    if (objectIds.length > 1000) {
      throw new Error('Cannot query more than 1000 objects at once');
    }
  }

  /**
   * Validate time range for efficiency data
   * @param timeRange - Time range string to validate
   * @throws Error if invalid
   */
  private validateTimeRangeForEfficiency(timeRange: string): void {
    const validRanges = [
      'last30days', '365days',
      '2023', '2024', '2025'
    ];

    if (!validRanges.includes(timeRange)) {
      throw new Error(`Invalid time range for efficiency. Must be one of: ${validRanges.join(', ')}`);
    }
  }
}

// Singleton instance
export const temperatureService = new TemperatureService();
