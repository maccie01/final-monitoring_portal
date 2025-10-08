import type { ObjectType, InsertObject, ObjectGroup, InsertObjectGroup } from "@shared/schema";

/**
 * Objects Module Types
 *
 * This module handles object-related types including objects, object groups,
 * and object-mandant assignments (hierarchical structure with mandant access control).
 */

// Re-export shared types
export type {
  ObjectType,
  InsertObject,
  ObjectGroup,
  InsertObjectGroup,
};

// Object filters for query operations
export interface ObjectFilters {
  mandantIds?: number[];
  isAdmin?: boolean;
  status?: string;
  city?: string;
  postalCode?: string;
  objectType?: string;
}

// Object-Mandant assignment interface
export interface ObjectMandantAssignment {
  objectId: number;
  mandantId: number;
  mandantRole: 'verwalter' | 'handwerker' | 'betreuer' | 'besitzer';
}

// API Response types
export interface ObjectResponse extends ObjectType {
  // Response may include additional computed fields
  mandantId?: number;
}

export interface ObjectsListResponse {
  objects: ObjectResponse[];
  total: number;
}

export interface ObjectGroupsListResponse {
  groups: ObjectGroup[];
  total: number;
}

// Object meter data response (lightweight for performance)
export interface ObjectMeterResponse {
  objectid: bigint;
  meter: any;
  report?: any;
}

// Object hierarchy response
export interface ObjectHierarchyResponse {
  objects: ObjectType[];
  total: number;
}

// Object mandant assignment response
export interface ObjectMandantAssignmentResponse {
  id: number;
  objectId: number;
  mandantId: number;
  mandantRole: string;
  mandantName?: string;
  mandantCategory?: string;
}
