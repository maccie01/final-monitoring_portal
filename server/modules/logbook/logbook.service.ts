import { logbookRepository } from "./logbook.repository";
import type { LogbookEntry, InsertLogbookEntry, LogbookFilters } from "./logbook.types";

/**
 * Logbook Service
 *
 * Business logic layer for logbook operations.
 * Handles logbook validation, business rules, and delegates CRUD to repository.
 */

export class LogbookService {
  // ============================================================================
  // LOGBOOK ENTRIES OPERATIONS
  // ============================================================================

  /**
   * Get logbook entries with optional filters
   * @param filters - Optional filters for objectId, status, priority, entryType
   * @returns Array of logbook entries
   */
  async getLogbookEntries(filters?: LogbookFilters): Promise<LogbookEntry[]> {
    // Validate filters if provided
    if (filters) {
      this.validateFilters(filters);
    }

    return await logbookRepository.getLogbookEntries(filters);
  }

  /**
   * Get single logbook entry by ID
   * @param id - Logbook entry ID
   * @returns Logbook entry or undefined
   */
  async getLogbookEntry(id: number): Promise<LogbookEntry | undefined> {
    this.validateId(id);
    return await logbookRepository.getLogbookEntry(id);
  }

  /**
   * Create new logbook entry with validation
   * @param entry - Logbook entry data to create
   * @returns Created logbook entry
   */
  async createLogbookEntry(entry: InsertLogbookEntry): Promise<LogbookEntry> {
    // Validate entry data
    this.validateLogbookEntry(entry);

    return await logbookRepository.createLogbookEntry(entry);
  }

  /**
   * Update logbook entry with validation
   * @param id - Logbook entry ID
   * @param entry - Partial logbook entry data to update
   * @returns Updated logbook entry
   */
  async updateLogbookEntry(id: number, entry: Partial<InsertLogbookEntry>): Promise<LogbookEntry> {
    this.validateId(id);

    // Validate partial entry data
    if (Object.keys(entry).length === 0) {
      throw new Error('No fields to update');
    }

    // Validate individual fields if present
    if (entry.title !== undefined) {
      this.validateTitle(entry.title);
    }
    if (entry.entryType !== undefined) {
      this.validateEntryType(entry.entryType);
    }
    if (entry.status !== undefined) {
      this.validateStatus(entry.status);
    }
    if (entry.priority !== undefined) {
      this.validatePriority(entry.priority);
    }

    return await logbookRepository.updateLogbookEntry(id, entry);
  }

  /**
   * Delete logbook entry
   * @param id - Logbook entry ID
   * @returns void
   */
  async deleteLogbookEntry(id: number): Promise<void> {
    this.validateId(id);
    return await logbookRepository.deleteLogbookEntry(id);
  }

  // ============================================================================
  // VALIDATION HELPER METHODS
  // ============================================================================

  /**
   * Validate logbook entry data
   * @param entry - Logbook entry data to validate
   * @throws Error if validation fails
   */
  private validateLogbookEntry(entry: InsertLogbookEntry): void {
    if (!entry) {
      throw new Error('Logbook entry data is required');
    }

    // Validate required fields
    this.validateTitle(entry.title);
    this.validateEntryType(entry.entryType);

    // Validate optional fields if present
    if (entry.status) {
      this.validateStatus(entry.status);
    }
    if (entry.priority) {
      this.validatePriority(entry.priority);
    }
    if (entry.objectId !== undefined && entry.objectId !== null) {
      this.validateObjectId(entry.objectId);
    }
  }

  /**
   * Validate entry ID
   * @param id - Entry ID to validate
   * @throws Error if invalid
   */
  private validateId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Entry ID must be a positive integer');
    }
  }

  /**
   * Validate title
   * @param title - Title to validate
   * @throws Error if invalid
   */
  private validateTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }

    if (title.length === 0) {
      throw new Error('Title cannot be empty');
    }

    if (title.length > 500) {
      throw new Error('Title must not exceed 500 characters');
    }
  }

  /**
   * Validate entry type
   * @param entryType - Entry type to validate
   * @throws Error if invalid
   */
  private validateEntryType(entryType: string): void {
    if (!entryType || typeof entryType !== 'string') {
      throw new Error('Entry type is required and must be a string');
    }

    const validEntryTypes = ['maintenance', 'inspection', 'repair', 'note', 'incident'];
    if (!validEntryTypes.includes(entryType)) {
      throw new Error(`Entry type must be one of: ${validEntryTypes.join(', ')}`);
    }
  }

  /**
   * Validate status
   * @param status - Status to validate
   * @throws Error if invalid
   */
  private validateStatus(status: string): void {
    if (typeof status !== 'string') {
      throw new Error('Status must be a string');
    }

    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  /**
   * Validate priority
   * @param priority - Priority to validate
   * @throws Error if invalid
   */
  private validatePriority(priority: string): void {
    if (typeof priority !== 'string') {
      throw new Error('Priority must be a string');
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw new Error(`Priority must be one of: ${validPriorities.join(', ')}`);
    }
  }

  /**
   * Validate object ID
   * @param objectId - Object ID to validate
   * @throws Error if invalid
   */
  private validateObjectId(objectId: bigint | number): void {
    const numericId = typeof objectId === 'bigint' ? Number(objectId) : objectId;
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new Error('Object ID must be a positive integer');
    }
  }

  /**
   * Validate filters
   * @param filters - Filters to validate
   * @throws Error if invalid
   */
  private validateFilters(filters: LogbookFilters): void {
    if (filters.objectId !== undefined) {
      if (!Number.isInteger(filters.objectId) || filters.objectId <= 0) {
        throw new Error('Filter objectId must be a positive integer');
      }
    }

    if (filters.status !== undefined) {
      this.validateStatus(filters.status);
    }

    if (filters.priority !== undefined) {
      this.validatePriority(filters.priority);
    }

    if (filters.entryType !== undefined) {
      this.validateEntryType(filters.entryType);
    }
  }
}

// Singleton instance
export const logbookService = new LogbookService();
