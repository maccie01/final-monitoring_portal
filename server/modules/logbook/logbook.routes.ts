import { Router } from "express";
import { logbookController } from "./logbook.controller";

/**
 * Logbook Routes
 *
 * Express router for logbook endpoints.
 * Defines routes for CRUD operations on logbook entries.
 */

const router = Router();

// ============================================================================
// LOGBOOK ENTRIES ROUTES
// ============================================================================

/**
 * GET /api/logbook
 * Get logbook entries with optional filters
 * Query params: objectId, status, priority, entryType (all optional)
 */
router.get("/", logbookController.getLogbookEntriesHandler);

/**
 * GET /api/logbook/:id
 * Get single logbook entry by ID
 */
router.get("/:id", logbookController.getLogbookEntryHandler);

/**
 * POST /api/logbook
 * Create new logbook entry
 * Body: Logbook entry data (title, entryType, description, objectId, status, priority)
 */
router.post("/", logbookController.createLogbookEntryHandler);

/**
 * PUT /api/logbook/:id
 * Update logbook entry
 * Body: Partial logbook entry data
 */
router.put("/:id", logbookController.updateLogbookEntryHandler);

/**
 * DELETE /api/logbook/:id
 * Delete logbook entry
 */
router.delete("/:id", logbookController.deleteLogbookEntryHandler);

export default router;
