import { monitoringRepository } from "./monitoring.repository";
import type { DashboardKPIs, CriticalSystem, SystemByEnergyClass, MonitoringFilters } from "./monitoring.types";

/**
 * Monitoring Service
 *
 * Business logic layer for monitoring operations.
 * Handles monitoring validation, business rules, and delegates CRUD to repository.
 */

export class MonitoringService {
  // ============================================================================
  // DASHBOARD KPIs OPERATIONS
  // ============================================================================

  /**
   * Get dashboard KPIs
   * @returns Dashboard KPIs including critical systems, facilities, efficiency, and renewable share
   */
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    return await monitoringRepository.getDashboardKPIs();
  }

  // ============================================================================
  // CRITICAL SYSTEMS OPERATIONS
  // ============================================================================

  /**
   * Get critical systems with validation
   * @param mandantIds - Optional array of mandant IDs for filtering
   * @param isAdmin - Whether the user is an admin
   * @returns Array of critical systems
   */
  async getCriticalSystems(mandantIds?: number[], isAdmin?: boolean): Promise<CriticalSystem[]> {
    // Validate mandant IDs if provided
    if (mandantIds && mandantIds.length > 0) {
      this.validateMandantIds(mandantIds);
    }

    return await monitoringRepository.getCriticalSystems(mandantIds, isAdmin);
  }

  // ============================================================================
  // ENERGY CLASS OPERATIONS
  // ============================================================================

  /**
   * Get systems by energy class with validation
   * @param mandantIds - Optional array of mandant IDs for filtering
   * @param isAdmin - Whether the user is an admin
   * @returns Array of systems classified by energy consumption
   */
  async getSystemsByEnergyClass(mandantIds?: number[], isAdmin?: boolean): Promise<SystemByEnergyClass[]> {
    // Validate mandant IDs if provided
    if (mandantIds && mandantIds.length > 0) {
      this.validateMandantIds(mandantIds);
    }

    return await monitoringRepository.getSystemsByEnergyClass(mandantIds, isAdmin);
  }

  // ============================================================================
  // SYSTEM ALERTS OPERATIONS
  // ============================================================================

  /**
   * Get system alerts with validation
   * @param filters - Optional filters for alerts
   * @returns Array of system alerts
   */
  async getSystemAlerts(filters?: MonitoringFilters): Promise<any[]> {
    // Validate system ID if provided
    if (filters?.systemId !== undefined) {
      this.validateSystemId(filters.systemId);
    }

    // Validate mandant IDs if provided
    if (filters?.mandantIds && filters.mandantIds.length > 0) {
      this.validateMandantIds(filters.mandantIds);
    }

    return await monitoringRepository.getSystemAlerts(
      filters?.systemId,
      filters?.unresolved,
      filters?.mandantIds,
      filters?.isAdmin
    );
  }

  /**
   * Create system alert with validation
   * @param alertData - Alert data to create
   * @returns Created system alert
   */
  async createSystemAlert(alertData: any): Promise<any> {
    // Validate alert data
    this.validateAlertData(alertData);

    return await monitoringRepository.createSystemAlert(alertData);
  }

  /**
   * Resolve alert with validation
   * @param id - Alert ID
   * @param userId - User ID who resolved the alert
   * @returns Resolved system alert
   */
  async resolveAlert(id: number, userId: string): Promise<any> {
    // Validate alert ID
    this.validateAlertId(id);

    // Validate user ID
    this.validateUserId(userId);

    return await monitoringRepository.resolveAlert(id, userId);
  }

  // ============================================================================
  // VALIDATION HELPER METHODS
  // ============================================================================

  /**
   * Validate alert data
   * @param alertData - Alert data to validate
   * @throws Error if validation fails
   */
  private validateAlertData(alertData: any): void {
    if (!alertData) {
      throw new Error('Alert data is required');
    }

    // Validate message
    if (!alertData.message || typeof alertData.message !== 'string') {
      throw new Error('Alert message is required and must be a string');
    }

    if (alertData.message.length > 1000) {
      throw new Error('Alert message must not exceed 1000 characters');
    }

    // Validate alert type if provided
    if (alertData.alertType && typeof alertData.alertType !== 'string') {
      throw new Error('Alert type must be a string');
    }

    // Validate severity if provided
    if (alertData.severity) {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(alertData.severity)) {
        throw new Error(`Alert severity must be one of: ${validSeverities.join(', ')}`);
      }
    }

    // Validate object ID if provided
    if (alertData.objectId !== undefined && alertData.objectId !== null) {
      if (!Number.isInteger(alertData.objectId) || alertData.objectId <= 0) {
        throw new Error('Object ID must be a positive integer');
      }
    }

    // Validate metadata if provided
    if (alertData.metadata && typeof alertData.metadata !== 'object') {
      throw new Error('Alert metadata must be an object');
    }
  }

  /**
   * Validate system/object ID
   * @param systemId - System ID to validate
   * @throws Error if invalid
   */
  private validateSystemId(systemId: number): void {
    if (!Number.isInteger(systemId) || systemId <= 0) {
      throw new Error('System ID must be a positive integer');
    }
  }

  /**
   * Validate alert ID
   * @param id - Alert ID to validate
   * @throws Error if invalid
   */
  private validateAlertId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Alert ID must be a positive integer');
    }
  }

  /**
   * Validate user ID
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
   * Validate mandant IDs array
   * @param mandantIds - Array of mandant IDs to validate
   * @throws Error if invalid
   */
  private validateMandantIds(mandantIds: number[]): void {
    if (!Array.isArray(mandantIds)) {
      throw new Error('Mandant IDs must be an array');
    }

    if (mandantIds.length === 0) {
      throw new Error('Mandant IDs array cannot be empty');
    }

    for (const id of mandantIds) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('All mandant IDs must be positive integers');
      }
    }
  }

  /**
   * Calculate dashboard metrics from raw data
   * @param data - Raw data from repository
   * @returns Calculated dashboard metrics
   */
  calculateDashboardMetrics(data: any): DashboardKPIs {
    // This method can be used for additional business logic calculations
    // For now, we return the data as-is since the repository handles the calculations
    return {
      criticalSystems: data.criticalSystems || 0,
      totalFacilities: data.totalFacilities || 0,
      activeFacilities: data.activeFacilities || 0,
      averageEfficiency: data.averageEfficiency || 0,
      averageRenewableShare: data.averageRenewableShare || 0,
    };
  }
}

// Singleton instance
export const monitoringService = new MonitoringService();
