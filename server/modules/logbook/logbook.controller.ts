import type { Request, Response } from "express";
import { logbookService } from "./logbook.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";

/**
 * Logbook Controller
 *
 * HTTP request/response handling for logbook endpoints.
 * Handles CRUD operations for logbook entries.
 */

export const logbookController = {
  // ============================================================================
  // LOGBOOK ENTRIES ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/logbook
   * Get logbook entries with optional filters
   * Auth: Requires authentication
   * Query params: objectId, status, priority, entryType (all optional)
   * Returns: Array of logbook entries
   */
  getLogbookEntriesHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Parse query parameters
    const filters: any = {};
    if (req.query.objectId) {
      filters.objectId = parseInt(req.query.objectId as string);
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }
    if (req.query.priority) {
      filters.priority = req.query.priority as string;
    }
    if (req.query.entryType) {
      filters.entryType = req.query.entryType as string;
    }

    const entries = await logbookService.getLogbookEntries(filters);
    res.json(entries);
  }),

  /**
   * API: GET /api/logbook/:id
   * Get single logbook entry by ID
   * Auth: Requires authentication
   * Returns: Logbook entry
   */
  getLogbookEntryHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError("Entry ID ist erforderlich");
    }

    const entry = await logbookService.getLogbookEntry(parseInt(id));

    if (!entry) {
      throw createNotFoundError("Logbook entry nicht gefunden");
    }

    res.json(entry);
  }),

  /**
   * API: POST /api/logbook
   * Create new logbook entry
   * Auth: Requires authentication
   * Body: Logbook entry data (title, entryType, description, objectId, status, priority)
   * Returns: Created logbook entry
   */
  createLogbookEntryHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const entryData = req.body;

    // Validate required fields
    if (!entryData.title) {
      throw createValidationError("Title ist erforderlich");
    }
    if (!entryData.entryType) {
      throw createValidationError("Entry type ist erforderlich");
    }

    const newEntry = await logbookService.createLogbookEntry(entryData);
    res.status(201).json(newEntry);
  }),

  /**
   * API: PUT /api/logbook/:id
   * Update logbook entry
   * Auth: Requires authentication
   * Body: Partial logbook entry data
   * Returns: Updated logbook entry
   */
  updateLogbookEntryHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError("Entry ID ist erforderlich");
    }

    const entryData = req.body;

    if (!entryData || Object.keys(entryData).length === 0) {
      throw createValidationError("Keine Daten zum Aktualisieren vorhanden");
    }

    const updatedEntry = await logbookService.updateLogbookEntry(parseInt(id), entryData);

    if (!updatedEntry) {
      throw createNotFoundError("Logbook entry nicht gefunden");
    }

    res.json(updatedEntry);
  }),

  /**
   * API: DELETE /api/logbook/:id
   * Delete logbook entry
   * Auth: Requires authentication
   * Returns: Success message
   */
  deleteLogbookEntryHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError("Entry ID ist erforderlich");
    }

    await logbookService.deleteLogbookEntry(parseInt(id));

    res.json({ message: "Logbook entry erfolgreich gelöscht" });
  }),
};
