import type { Request, Response } from "express";
import { temperatureService } from "./temperature.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";
import type { InsertDailyOutdoorTemperature } from "@shared/schema";

/**
 * Temperature Controller
 *
 * HTTP request/response handling for temperature management endpoints.
 * Handles daily outdoor temperature data, postal code queries, and efficiency data.
 */

export const temperatureController = {
  // ============================================================================
  // DAILY OUTDOOR TEMPERATURE ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/temperature/daily-outdoor
   * Get daily outdoor temperatures with optional filters
   * Auth: Requires authentication
   * Query params: postalCode, startDate, endDate, resolution (all optional)
   * Returns: Array of DailyOutdoorTemperature records
   */
  getDailyOutdoorTemperaturesHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { postalCode, startDate, endDate, resolution } = req.query;

    // Parse dates if provided
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const data = await temperatureService.getDailyOutdoorTemperatures(
      postalCode as string | undefined,
      start,
      end,
      resolution as string | undefined
    );
    res.json(data);
  }),

  /**
   * API: GET /api/temperature/daily-outdoor/:id
   * Get single daily outdoor temperature by ID
   * Auth: Requires authentication
   * Returns: DailyOutdoorTemperature record
   */
  getDailyOutdoorTemperatureHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    const data = await temperatureService.getDailyOutdoorTemperature(parseInt(id));

    if (!data) {
      throw createNotFoundError("Temperaturdaten nicht gefunden");
    }

    res.json(data);
  }),

  /**
   * API: POST /api/temperature/daily-outdoor
   * Create new daily outdoor temperature record
   * Auth: Requires admin or superadmin role
   * Returns: Created DailyOutdoorTemperature record
   */
  createDailyOutdoorTemperatureHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create temperature data
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Temperaturdaten");
    }

    const temperatureData = req.body as InsertDailyOutdoorTemperature;

    // Validate required fields
    if (!temperatureData.date) {
      throw createValidationError("Datum ist erforderlich");
    }

    if (!temperatureData.postalCode) {
      throw createValidationError("Postleitzahl ist erforderlich");
    }

    const newData = await temperatureService.createDailyOutdoorTemperature(temperatureData);
    res.status(201).json(newData);
  }),

  /**
   * API: PUT /api/temperature/daily-outdoor/:id
   * Update existing daily outdoor temperature record
   * Auth: Requires admin or superadmin role
   * Returns: Updated DailyOutdoorTemperature record
   */
  updateDailyOutdoorTemperatureHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update temperature data
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Aktualisieren von Temperaturdaten");
    }

    const { id } = req.params;
    const temperatureData = req.body as Partial<InsertDailyOutdoorTemperature>;

    const updatedData = await temperatureService.updateDailyOutdoorTemperature(parseInt(id), temperatureData);
    res.json(updatedData);
  }),

  /**
   * API: DELETE /api/temperature/daily-outdoor/:id
   * Delete daily outdoor temperature record
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteDailyOutdoorTemperatureHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete temperature data
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Temperaturdaten");
    }

    const { id } = req.params;

    await temperatureService.deleteDailyOutdoorTemperature(parseInt(id));
    res.json({ message: "Temperaturdaten erfolgreich gelöscht" });
  }),

  // ============================================================================
  // POSTAL CODE QUERY ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/temperature/postal-code/:postalCode
   * Get temperatures by postal code with optional date range
   * Auth: Requires authentication
   * Query params: startDate, endDate (optional)
   * Returns: Array of DailyOutdoorTemperature records
   */
  getTemperaturesByPostalCodeHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { postalCode } = req.params;
    const { startDate, endDate } = req.query;

    // Parse dates if provided
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const data = await temperatureService.getTemperaturesByPostalCode(postalCode, start, end);
    res.json(data);
  }),

  /**
   * API: GET /api/temperature/postal-code/:postalCode/latest
   * Get latest temperature for a specific postal code
   * Auth: Requires authentication
   * Returns: Latest DailyOutdoorTemperature record
   */
  getLatestTemperatureForPostalCodeHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { postalCode } = req.params;

    const data = await temperatureService.getLatestTemperatureForPostalCode(postalCode);

    if (!data) {
      throw createNotFoundError("Keine Temperaturdaten für diese Postleitzahl gefunden");
    }

    res.json(data);
  }),

  /**
   * API: GET /api/temperature/objects/postal-codes
   * Get temperatures for postal codes of specified objects
   * Auth: Requires authentication
   * Query params: objectIds (optional comma-separated)
   * Returns: Array of DailyOutdoorTemperature records
   */
  getTemperaturesForObjectPostalCodesHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectIds } = req.query;

    // Parse object IDs if provided
    let parsedObjectIds: number[] | undefined;
    if (objectIds) {
      parsedObjectIds = (objectIds as string)
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));
    }

    const data = await temperatureService.getTemperaturesForObjectPostalCodes(parsedObjectIds);
    res.json(data);
  }),

  // ============================================================================
  // EFFICIENCY DATA ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/temperature/efficiency/:objectId
   * Get temperature efficiency data for an object
   * Auth: Requires authentication
   * Query params: timeRange (optional, default 'last30days')
   * Returns: Array of temperature efficiency data points
   */
  getTemperatureEfficiencyDataHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;
    const { timeRange } = req.query;

    const data = await temperatureService.getTemperatureEfficiencyData(
      parseInt(objectId),
      timeRange as string | undefined
    );
    res.json(data);
  }),
};
