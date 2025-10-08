import type { LogbookEntry, InsertLogbookEntry } from "@shared/schema";

/**
 * Logbook Module Types
 *
 * This module handles logbook-related types including entries,
 * filters, and API responses.
 */

// Re-export shared types
export type {
  LogbookEntry,
  InsertLogbookEntry,
};

// Logbook filters for query operations
export interface LogbookFilters {
  objectId?: number;
  status?: string;
  priority?: string;
  entryType?: string;
}

// API Response types
export interface LogbookResponse {
  id: number;
  objectId: bigint | null;
  entryType: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  objectName?: string;
}

export interface LogbookListResponse {
  entries: LogbookResponse[];
  total: number;
}
