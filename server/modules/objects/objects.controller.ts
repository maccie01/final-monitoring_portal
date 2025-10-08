import type { Request, Response } from "express";
import { objectsService } from "./objects.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";
import type { InsertObject, InsertObjectGroup } from "@shared/schema";
import type { ObjectMandantAssignment } from "./objects.types";

/**
 * Objects Controller
 *
 * HTTP request/response handling for object management endpoints.
 * Handles objects, object groups, and object-mandant assignments with proper authorization.
 */

export const objectsController = {
  // ============================================================================
  // OBJECT CRUD OPERATIONS
  // ============================================================================

  /**
   * API: GET /api/objects
   * Get all objects based on user role and mandant access
   * Auth: Requires authentication
   * Returns: Array of objects filtered by mandant permissions
   */
  getObjects: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Determine if user is admin
    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'superadmin';

    // Get accessible mandants
    const mandantIds = isAdmin ? undefined : [sessionUser.mandantId, ...(sessionUser.mandantAccess || [])];

    // Get objects with filters
    const objects = await objectsService.getObjects({
      mandantIds,
      isAdmin,
      status: req.query.status as string,
      city: req.query.city as string,
      postalCode: req.query.postalCode as string,
      objectType: req.query.objectType as string,
    });

    res.json(objects);
  }),

  /**
   * API: GET /api/objects/:id
   * Get single object by ID
   * Auth: Users can view objects from their mandant
   * Returns: Object data
   */
  getObjectById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const object = await objectsService.getObjectById(parseInt(id));
    if (!object) {
      throw createNotFoundError("Objekt nicht gefunden");
    }

    // Check access permissions (admin or same mandant)
    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'superadmin';
    const hasAccess = isAdmin ||
                      object.mandantId === sessionUser.mandantId ||
                      (sessionUser.mandantAccess && sessionUser.mandantAccess.includes(object.mandantId));

    if (!hasAccess) {
      throw createAuthError("Keine Berechtigung für dieses Objekt");
    }

    res.json(object);
  }),

  /**
   * API: GET /api/objects/objectid/:objectid
   * Get object by objectid (bigint identifier)
   * Auth: Users can view objects from their mandant
   * Returns: Object data
   */
  getObjectByObjectId: asyncHandler(async (req: Request, res: Response) => {
    const { objectid } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const object = await objectsService.getObjectByObjectId(BigInt(objectid));
    if (!object) {
      throw createNotFoundError("Objekt nicht gefunden");
    }

    // Check access permissions
    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'superadmin';
    const hasAccess = isAdmin ||
                      object.mandantId === sessionUser.mandantId ||
                      (sessionUser.mandantAccess && sessionUser.mandantAccess.includes(object.mandantId));

    if (!hasAccess) {
      throw createAuthError("Keine Berechtigung für dieses Objekt");
    }

    res.json(object);
  }),

  /**
   * API: GET /api/objects/postal/:postalCode
   * Get object by postal code
   * Auth: Requires authentication
   * Returns: Object data
   */
  getObjectByPostalCode: asyncHandler(async (req: Request, res: Response) => {
    const { postalCode } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const object = await objectsService.getObjectByPostalCode(postalCode);
    if (!object) {
      throw createNotFoundError("Objekt nicht gefunden");
    }

    res.json(object);
  }),

  /**
   * API: GET /api/objects/meter/:objectid
   * Get object meter data by objectid
   * Auth: Requires authentication
   * Returns: Meter data
   */
  getObjectMeterByObjectId: asyncHandler(async (req: Request, res: Response) => {
    const { objectid } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const meterData = await objectsService.getObjectMeterByObjectId(BigInt(objectid));
    if (!meterData) {
      throw createNotFoundError("Meter-Daten nicht gefunden");
    }

    res.json(meterData);
  }),

  /**
   * API: POST /api/objects
   * Create new object
   * Auth: Requires admin or superadmin role
   * Returns: Created object
   */
  createObject: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create objects
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Objekten");
    }

    const objectData = req.body as InsertObject;

    // Validate required fields
    if (!objectData.name || !objectData.objectid) {
      throw createValidationError("Name und Objekt-ID sind erforderlich");
    }

    // Set mandant for non-superadmin users
    if (sessionUser.role === 'admin' && !objectData.mandantId) {
      objectData.mandantId = sessionUser.mandantId;
    }

    const newObject = await objectsService.createObject(objectData);
    res.status(201).json(newObject);
  }),

  /**
   * API: PUT /api/objects/:id
   * Update object
   * Auth: Requires admin or superadmin role
   * Returns: Updated object
   */
  updateObject: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;
    const updateData = req.body as Partial<InsertObject>;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update objects
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Bearbeiten von Objekten");
    }

    // Check if object exists and user has access
    const existingObject = await objectsService.getObjectById(parseInt(id));
    if (!existingObject) {
      throw createNotFoundError("Objekt nicht gefunden");
    }

    // Admins can only update objects from their mandant (except superadmin)
    if (sessionUser.role === 'admin' && existingObject.mandantId !== sessionUser.mandantId) {
      throw createAuthError("Keine Berechtigung zum Bearbeiten dieses Objekts");
    }

    const updatedObject = await objectsService.updateObject(parseInt(id), updateData);
    res.json(updatedObject);
  }),

  /**
   * API: PATCH /api/objects/:id/coordinates
   * Update object coordinates
   * Auth: Requires admin or superadmin role
   * Returns: Updated object
   */
  updateObjectCoordinates: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update coordinates
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Bearbeiten von Koordinaten");
    }

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      throw createValidationError("Latitude und Longitude sind erforderlich");
    }

    const updatedObject = await objectsService.updateObjectCoordinates(
      parseInt(id),
      parseFloat(latitude),
      parseFloat(longitude)
    );
    res.json(updatedObject);
  }),

  /**
   * API: DELETE /api/objects/:id
   * Delete object
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteObject: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete objects
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Objekten");
    }

    // Check if object exists and user has access
    const existingObject = await objectsService.getObjectById(parseInt(id));
    if (!existingObject) {
      throw createNotFoundError("Objekt nicht gefunden");
    }

    // Admins can only delete objects from their mandant (except superadmin)
    if (sessionUser.role === 'admin' && existingObject.mandantId !== sessionUser.mandantId) {
      throw createAuthError("Keine Berechtigung zum Löschen dieses Objekts");
    }

    await objectsService.deleteObject(parseInt(id));
    res.json({ message: "Objekt erfolgreich gelöscht" });
  }),

  /**
   * API: PATCH /api/objects/:id/meter
   * Update object meter data
   * Auth: Requires admin or superadmin role
   * Returns: Updated object
   */
  updateObjectMeter: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const meterData = req.body;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update meter data
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Bearbeiten von Meter-Daten");
    }

    const updatedObject = await objectsService.updateObjectMeter(parseInt(id), meterData);
    res.json(updatedObject);
  }),

  /**
   * API: GET /api/objects/:id/children
   * Get object children (hierarchical)
   * Auth: Requires authentication
   * Returns: Array of child objects
   */
  getObjectChildren: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const children = await objectsService.getObjectChildren(parseInt(id));
    res.json(children);
  }),

  /**
   * API: GET /api/objects/hierarchy/:mandantId
   * Get object hierarchy by mandant
   * Auth: Requires authentication
   * Returns: Array of objects in hierarchy
   */
  getObjectHierarchy: asyncHandler(async (req: Request, res: Response) => {
    const { mandantId } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const hierarchy = await objectsService.getObjectHierarchy(parseInt(mandantId));
    res.json(hierarchy);
  }),

  // ============================================================================
  // OBJECT-MANDANT ASSIGNMENTS
  // ============================================================================

  /**
   * API: POST /api/objects/:id/assignments
   * Create object-mandant assignment
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  createObjectMandantAssignment: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create assignments
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Zuweisungen");
    }

    const assignmentData: ObjectMandantAssignment = {
      objectId: parseInt(id),
      mandantId: req.body.mandantId,
      mandantRole: req.body.mandantRole,
    };

    // Validate required fields
    if (!assignmentData.mandantId || !assignmentData.mandantRole) {
      throw createValidationError("Mandanten-ID und Rolle sind erforderlich");
    }

    await objectsService.createObjectMandantAssignment(assignmentData);
    res.status(201).json({ message: "Zuweisung erfolgreich erstellt" });
  }),

  /**
   * API: GET /api/objects/:id/assignments
   * Get object-mandant assignments
   * Auth: Requires authentication
   * Returns: Array of assignments
   */
  getObjectMandantAssignments: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const assignments = await objectsService.getObjectMandantAssignments(parseInt(id));
    res.json(assignments);
  }),

  /**
   * API: DELETE /api/objects/:id/assignments
   * Delete all object-mandant assignments
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteObjectMandantAssignments: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete assignments
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Zuweisungen");
    }

    await objectsService.deleteObjectMandantAssignments(parseInt(id));
    res.json({ message: "Zuweisungen erfolgreich gelöscht" });
  }),

  /**
   * API: DELETE /api/objects/:id/assignments/:role
   * Delete object-mandant assignments by role
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteObjectMandantAssignmentsByRole: asyncHandler(async (req: Request, res: Response) => {
    const { id, role } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete assignments
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Zuweisungen");
    }

    await objectsService.deleteObjectMandantAssignmentsByRole(parseInt(id), role);
    res.json({ message: "Zuweisungen erfolgreich gelöscht" });
  }),

  // ============================================================================
  // OBJECT GROUPS MANAGEMENT
  // ============================================================================

  /**
   * API: GET /api/objects/groups
   * Get all object groups
   * Auth: Requires authentication
   * Returns: Array of object groups
   */
  getObjectGroups: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const groups = await objectsService.getObjectGroups();
    res.json(groups);
  }),

  /**
   * API: POST /api/objects/groups
   * Create object group
   * Auth: Requires admin or superadmin role
   * Returns: Created object group
   */
  createObjectGroup: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create object groups
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Objektgruppen");
    }

    const groupData = req.body as InsertObjectGroup;

    if (!groupData.name) {
      throw createValidationError("Gruppenname ist erforderlich");
    }

    const newGroup = await objectsService.createObjectGroup(groupData);
    res.status(201).json(newGroup);
  }),

  /**
   * API: PUT /api/objects/groups/:id
   * Update object group
   * Auth: Requires admin or superadmin role
   * Returns: Updated object group
   */
  updateObjectGroup: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;
    const updateData = req.body as Partial<InsertObjectGroup>;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update object groups
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Bearbeiten von Objektgruppen");
    }

    const updatedGroup = await objectsService.updateObjectGroup(parseInt(id), updateData);
    res.json(updatedGroup);
  }),

  /**
   * API: DELETE /api/objects/groups/:id
   * Delete object group
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteObjectGroup: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete object groups
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Objektgruppen");
    }

    await objectsService.deleteObjectGroup(parseInt(id));
    res.json({ message: "Objektgruppe erfolgreich gelöscht" });
  }),
};
