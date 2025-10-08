import { Router } from "express";
import { objectsController } from "./objects.controller";

/**
 * Objects Routes
 *
 * Express router for object management endpoints.
 * Defines routes for objects, object groups, and object-mandant assignments.
 */

const router = Router();

// ============================================================================
// OBJECT ROUTES
// ============================================================================

/**
 * GET /api/objects
 * Get all objects (filtered by mandant access)
 */
router.get("/", objectsController.getObjects);

/**
 * GET /api/objects/:id
 * Get single object by ID
 */
router.get("/:id", objectsController.getObjectById);

/**
 * GET /api/objects/objectid/:objectid
 * Get object by objectid (bigint identifier)
 */
router.get("/objectid/:objectid", objectsController.getObjectByObjectId);

/**
 * GET /api/objects/postal/:postalCode
 * Get object by postal code
 */
router.get("/postal/:postalCode", objectsController.getObjectByPostalCode);

/**
 * GET /api/objects/meter/:objectid
 * Get object meter data by objectid
 */
router.get("/meter/:objectid", objectsController.getObjectMeterByObjectId);

/**
 * GET /api/objects/:id/children
 * Get object children (hierarchical)
 */
router.get("/:id/children", objectsController.getObjectChildren);

/**
 * GET /api/objects/hierarchy/:mandantId
 * Get object hierarchy by mandant
 */
router.get("/hierarchy/:mandantId", objectsController.getObjectHierarchy);

/**
 * POST /api/objects
 * Create new object
 */
router.post("/", objectsController.createObject);

/**
 * PUT /api/objects/:id
 * Update object
 */
router.put("/:id", objectsController.updateObject);

/**
 * PATCH /api/objects/:id/coordinates
 * Update object coordinates
 */
router.patch("/:id/coordinates", objectsController.updateObjectCoordinates);

/**
 * PATCH /api/objects/:id/meter
 * Update object meter data
 */
router.patch("/:id/meter", objectsController.updateObjectMeter);

/**
 * DELETE /api/objects/:id
 * Delete object
 */
router.delete("/:id", objectsController.deleteObject);

// ============================================================================
// OBJECT-MANDANT ASSIGNMENT ROUTES
// ============================================================================

/**
 * POST /api/objects/:id/assignments
 * Create object-mandant assignment
 */
router.post("/:id/assignments", objectsController.createObjectMandantAssignment);

/**
 * GET /api/objects/:id/assignments
 * Get object-mandant assignments
 */
router.get("/:id/assignments", objectsController.getObjectMandantAssignments);

/**
 * DELETE /api/objects/:id/assignments
 * Delete all object-mandant assignments
 */
router.delete("/:id/assignments", objectsController.deleteObjectMandantAssignments);

/**
 * DELETE /api/objects/:id/assignments/:role
 * Delete object-mandant assignments by role
 */
router.delete("/:id/assignments/:role", objectsController.deleteObjectMandantAssignmentsByRole);

// ============================================================================
// OBJECT GROUPS ROUTES
// ============================================================================

/**
 * GET /api/objects/groups
 * Get all object groups
 */
router.get("/groups", objectsController.getObjectGroups);

/**
 * POST /api/objects/groups
 * Create object group
 */
router.post("/groups", objectsController.createObjectGroup);

/**
 * PUT /api/objects/groups/:id
 * Update object group
 */
router.put("/groups/:id", objectsController.updateObjectGroup);

/**
 * DELETE /api/objects/groups/:id
 * Delete object group
 */
router.delete("/groups/:id", objectsController.deleteObjectGroup);

export default router;
