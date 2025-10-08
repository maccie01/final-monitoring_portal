import { objectsRepository } from "./objects.repository";
import type {
  ObjectType,
  InsertObject,
  ObjectGroup,
  InsertObjectGroup,
} from "@shared/schema";
import type {
  ObjectResponse,
  ObjectFilters,
  ObjectMandantAssignment,
  ObjectMeterResponse,
} from "./objects.types";

/**
 * Objects Service
 *
 * Business logic layer for object, object group, and mandant assignment operations.
 * Handles object management, data validation, and access control for hierarchical objects.
 */

export class ObjectsService {
  // ===== OBJECTS CRUD =====

  /**
   * Get all objects with filters
   * Handles admin vs regular user access control
   *
   * @param filters - Object filters (mandantIds, isAdmin, status, etc.)
   * @returns Array of objects based on filters
   */
  async getObjects(filters?: ObjectFilters): Promise<ObjectResponse[]> {
    const mandantIds = filters?.mandantIds;
    const isAdmin = filters?.isAdmin;

    const objects = await objectsRepository.getObjects(mandantIds, isAdmin);

    // Apply additional filters if provided
    let filteredObjects = objects;

    if (filters?.status) {
      filteredObjects = filteredObjects.filter(obj => obj.status === filters.status);
    }

    if (filters?.city) {
      filteredObjects = filteredObjects.filter(obj => obj.city === filters.city);
    }

    if (filters?.postalCode) {
      filteredObjects = filteredObjects.filter(obj => obj.postalCode === filters.postalCode);
    }

    if (filters?.objectType) {
      filteredObjects = filteredObjects.filter(obj => obj.objectType === filters.objectType);
    }

    return filteredObjects;
  }

  /**
   * Get object by ID
   *
   * @param id - Object ID
   * @returns Object if found
   */
  async getObjectById(id: number): Promise<ObjectResponse | null> {
    const object = await objectsRepository.getObject(id);
    return object || null;
  }

  /**
   * Get object by objectid (bigint identifier)
   *
   * @param objectid - Object ID (bigint)
   * @returns Object if found
   */
  async getObjectByObjectId(objectid: bigint): Promise<ObjectResponse | null> {
    const object = await objectsRepository.getObjectByObjectId(objectid);
    return object || null;
  }

  /**
   * Get object by postal code
   *
   * @param postalCode - Postal code to search
   * @returns Object if found
   */
  async getObjectByPostalCode(postalCode: string): Promise<ObjectResponse | null> {
    const object = await objectsRepository.getObjectByPostalCode(postalCode);
    return object || null;
  }

  /**
   * Get object meter data by objectid
   * Lightweight query for performance
   *
   * @param objectid - Object ID (bigint)
   * @returns Object meter data if found
   */
  async getObjectMeterByObjectId(objectid: bigint): Promise<ObjectMeterResponse | null> {
    const meterData = await objectsRepository.getObjectMeterByObjectId(objectid);
    return meterData || null;
  }

  /**
   * Create a new object
   * Validates required fields before creation
   *
   * @param objectData - Object data to create
   * @returns Created object
   */
  async createObject(objectData: InsertObject): Promise<ObjectResponse> {
    // Validate required fields
    if (!objectData.name) {
      throw new Error('Object name is required');
    }

    if (!objectData.objectid) {
      throw new Error('Object ID is required');
    }

    // Validate objectType if provided
    if (objectData.objectType && !this.isValidObjectType(objectData.objectType)) {
      throw new Error('Invalid object type');
    }

    return await objectsRepository.createObject(objectData);
  }

  /**
   * Update object by ID
   *
   * @param id - Object ID
   * @param objectData - Partial object data to update
   * @returns Updated object
   */
  async updateObject(id: number, objectData: Partial<InsertObject>): Promise<ObjectResponse> {
    // Check if object exists
    const existingObject = await objectsRepository.getObject(id);
    if (!existingObject) {
      throw new Error('Object not found');
    }

    // Validate objectType if being updated
    if (objectData.objectType && !this.isValidObjectType(objectData.objectType)) {
      throw new Error('Invalid object type');
    }

    return await objectsRepository.updateObject(id, objectData);
  }

  /**
   * Update object coordinates
   *
   * @param id - Object ID
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Updated object
   */
  async updateObjectCoordinates(id: number, latitude: number, longitude: number): Promise<ObjectResponse> {
    // Validate coordinates
    if (!this.isValidLatitude(latitude)) {
      throw new Error('Invalid latitude. Must be between -90 and 90');
    }

    if (!this.isValidLongitude(longitude)) {
      throw new Error('Invalid longitude. Must be between -180 and 180');
    }

    return await objectsRepository.updateObjectCoordinates(id, latitude, longitude);
  }

  /**
   * Delete object by ID
   *
   * @param id - Object ID to delete
   */
  async deleteObject(id: number): Promise<void> {
    const existingObject = await objectsRepository.getObject(id);
    if (!existingObject) {
      throw new Error('Object not found');
    }

    await objectsRepository.deleteObject(id);
  }

  /**
   * Update object meter data
   *
   * @param id - Object ID
   * @param meterData - Meter data to update
   * @returns Updated object
   */
  async updateObjectMeter(id: number, meterData: any): Promise<Object> {
    return await objectsRepository.updateObjectMeter(id, meterData);
  }

  /**
   * Get object children (hierarchical relationship)
   *
   * @param parentId - Parent object ID
   * @returns Array of child objects
   */
  async getObjectChildren(parentId: number): Promise<ObjectResponse[]> {
    return await objectsRepository.getObjectChildren(parentId);
  }

  /**
   * Get object hierarchy by mandant
   *
   * @param mandantId - Mandant ID
   * @returns Array of objects in hierarchy
   */
  async getObjectHierarchy(mandantId: number): Promise<ObjectResponse[]> {
    return await objectsRepository.getObjectHierarchy(mandantId);
  }

  // ===== OBJECT-MANDANT ASSIGNMENTS =====

  /**
   * Create object-mandant assignment
   *
   * @param assignment - Assignment data
   */
  async createObjectMandantAssignment(assignment: ObjectMandantAssignment): Promise<void> {
    // Validate mandant role
    const validRoles = ['verwalter', 'handwerker', 'betreuer', 'besitzer'];
    if (!validRoles.includes(assignment.mandantRole)) {
      throw new Error('Invalid mandant role');
    }

    await objectsRepository.createObjectMandantAssignment(assignment);
  }

  /**
   * Get object mandant assignments
   *
   * @param objectId - Object ID
   * @returns Array of assignments
   */
  async getObjectMandantAssignments(objectId: number): Promise<any[]> {
    return await objectsRepository.getObjectMandantAssignments(objectId);
  }

  /**
   * Delete all mandant assignments for an object
   *
   * @param objectId - Object ID
   */
  async deleteObjectMandantAssignments(objectId: number): Promise<void> {
    await objectsRepository.deleteObjectMandantAssignments(objectId);
  }

  /**
   * Delete mandant assignments by role
   *
   * @param objectId - Object ID
   * @param role - Mandant role to delete
   */
  async deleteObjectMandantAssignmentsByRole(objectId: number, role: string): Promise<void> {
    await objectsRepository.deleteObjectMandantAssignmentsByRole(objectId, role);
  }

  // ===== OBJECT GROUPS =====

  /**
   * Get all object groups
   *
   * @returns Array of object groups
   */
  async getObjectGroups(): Promise<ObjectGroup[]> {
    return await objectsRepository.getObjectGroups();
  }

  /**
   * Create object group
   *
   * @param groupData - Group data to create
   * @returns Created object group
   */
  async createObjectGroup(groupData: InsertObjectGroup): Promise<ObjectGroup> {
    // Validate required fields
    if (!groupData.name) {
      throw new Error('Object group name is required');
    }

    return await objectsRepository.createObjectGroup(groupData);
  }

  /**
   * Update object group
   *
   * @param id - Group ID
   * @param groupData - Partial group data to update
   * @returns Updated object group
   */
  async updateObjectGroup(id: number, groupData: Partial<InsertObjectGroup>): Promise<ObjectGroup> {
    return await objectsRepository.updateObjectGroup(id, groupData);
  }

  /**
   * Delete object group
   *
   * @param id - Group ID to delete
   */
  async deleteObjectGroup(id: number): Promise<void> {
    await objectsRepository.deleteObjectGroup(id);
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Validate object type
   *
   * @param objectType - Object type to validate
   * @returns true if valid
   */
  private isValidObjectType(objectType: string): boolean {
    const validTypes = ['building', 'facility', 'room', 'equipment', 'meter'];
    return validTypes.includes(objectType);
  }

  /**
   * Validate latitude coordinate
   *
   * @param latitude - Latitude to validate
   * @returns true if valid
   */
  private isValidLatitude(latitude: number): boolean {
    return latitude >= -90 && latitude <= 90;
  }

  /**
   * Validate longitude coordinate
   *
   * @param longitude - Longitude to validate
   * @returns true if valid
   */
  private isValidLongitude(longitude: number): boolean {
    return longitude >= -180 && longitude <= 180;
  }
}

// Singleton instance
export const objectsService = new ObjectsService();
