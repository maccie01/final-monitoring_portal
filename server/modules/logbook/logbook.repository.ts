import { getDb } from "../../db";
import { logbookEntries, objects } from "@shared/schema";
import { eq, and, desc, SQL } from "drizzle-orm";
import type { LogbookEntry, InsertLogbookEntry } from "@shared/schema";

/**
 * Logbook Repository
 *
 * Data access layer for logbook operations.
 * Handles direct database queries for logbook entries.
 * Uses Drizzle ORM for all operations.
 */

export class LogbookRepository {
  // ============================================================================
  // LOGBOOK ENTRIES OPERATIONS
  // ============================================================================

  /**
   * Get logbook entries with optional filters
   * @param filters - Optional filters for objectId, status, priority, entryType
   * @returns Array of logbook entries with object names
   */
  async getLogbookEntries(filters?: {
    objectId?: number;
    status?: string;
    priority?: string;
    entryType?: string;
  }): Promise<LogbookEntry[]> {
    const conditions: SQL[] = [];

    if (filters?.objectId) {
      conditions.push(eq(logbookEntries.objectId, BigInt(filters.objectId)));
    }
    if (filters?.status) {
      conditions.push(eq(logbookEntries.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(logbookEntries.priority, filters.priority));
    }
    if (filters?.entryType) {
      conditions.push(eq(logbookEntries.entryType, filters.entryType));
    }

    const entries = await getDb()
      .select({
        logbookEntry: logbookEntries,
        object: objects,
      })
      .from(logbookEntries)
      .leftJoin(objects, eq(logbookEntries.objectId, objects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(logbookEntries.createdAt));

    return entries.map(({ logbookEntry, object }) => ({
      ...logbookEntry,
      objectName: object?.name,
    })) as any;
  }

  /**
   * Get single logbook entry by ID
   * @param id - Logbook entry ID
   * @returns Logbook entry or undefined
   */
  async getLogbookEntry(id: number): Promise<LogbookEntry | undefined> {
    const [entry] = await getDb()
      .select()
      .from(logbookEntries)
      .where(eq(logbookEntries.id, id))
      .limit(1);
    return entry;
  }

  /**
   * Create new logbook entry
   * @param entry - Logbook entry data to create
   * @returns Created logbook entry
   */
  async createLogbookEntry(entry: InsertLogbookEntry): Promise<LogbookEntry> {
    const [newEntry] = await getDb()
      .insert(logbookEntries)
      .values(entry)
      .returning();
    return newEntry;
  }

  /**
   * Update logbook entry
   * @param id - Logbook entry ID
   * @param entry - Partial logbook entry data to update
   * @returns Updated logbook entry
   */
  async updateLogbookEntry(id: number, entry: Partial<InsertLogbookEntry>): Promise<LogbookEntry> {
    const [updatedEntry] = await getDb()
      .update(logbookEntries)
      .set({ ...entry, updatedAt: new Date() })
      .where(eq(logbookEntries.id, id))
      .returning();
    return updatedEntry;
  }

  /**
   * Delete logbook entry
   * @param id - Logbook entry ID
   * @returns void
   */
  async deleteLogbookEntry(id: number): Promise<void> {
    await getDb().delete(logbookEntries).where(eq(logbookEntries.id, id));
  }
}

// Singleton instance
export const logbookRepository = new LogbookRepository();
