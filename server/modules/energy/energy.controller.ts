import type { Request, Response } from "express";
import { energyService } from "./energy.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";
import type { InsertDayComp } from "@shared/schema";

/**
 * Energy Controller
 *
 * HTTP request/response handling for energy management endpoints.
 * Handles day compensation data, consumption metrics, and external energy data access.
 */

export const energyController = {
  // ============================================================================
  // DAY COMP DATA ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/energy/day-comp/:objectId
   * Get day compensation data for an object
   * Auth: Requires authentication
   * Query params: startDate, endDate (optional)
   * Returns: Array of DayComp records
   */
  getDayCompDataHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;
    const { startDate, endDate } = req.query;

    // Parse dates if provided
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const data = await energyService.getDayCompData(parseInt(objectId), start, end);
    res.json(data);
  }),

  /**
   * API: POST /api/energy/day-comp
   * Create new day compensation data entry
   * Auth: Requires admin or superadmin role
   * Returns: Created DayComp record
   */
  createDayCompDataHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create energy data
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Energiedaten");
    }

    const dayCompData = req.body as InsertDayComp;

    // Validate required fields
    if (!dayCompData.log) {
      throw createValidationError("Objekt-ID (log) ist erforderlich");
    }

    if (!dayCompData.time) {
      throw createValidationError("Zeitstempel ist erforderlich");
    }

    const newData = await energyService.createDayCompData(dayCompData);
    res.status(201).json(newData);
  }),

  /**
   * API: GET /api/energy/day-comp/:objectId/latest
   * Get latest day compensation data for an object
   * Auth: Requires authentication
   * Returns: Latest DayComp record
   */
  getLatestDayCompDataHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;

    const data = await energyService.getLatestDayCompData(parseInt(objectId));

    if (!data) {
      throw createNotFoundError("Keine Daten gefunden");
    }

    res.json(data);
  }),

  // ============================================================================
  // DAILY CONSUMPTION ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/energy/daily-consumption/:objectId
   * Get daily consumption statistics for an object
   * Auth: Requires authentication
   * Query params: startDate, endDate (optional)
   * Returns: Array of daily consumption data
   */
  getDailyConsumptionHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;
    const { startDate, endDate } = req.query;

    // Parse dates if provided
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const data = await energyService.getDailyConsumption(parseInt(objectId), start, end);
    res.json(data);
  }),

  // ============================================================================
  // EXTERNAL ENERGY DATA ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/energy/external/:objectId
   * Get external energy data from view_mon_comp
   * Auth: Requires authentication
   * Query params: limit (optional, default 12)
   * Returns: Array of external energy data
   */
  getEnergyDataExternalHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;
    const { limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string) : 12;

    const data = await energyService.getEnergyDataExternal(parseInt(objectId), parsedLimit);
    res.json(data);
  }),

  /**
   * API: GET /api/energy/all-meters/:objectId
   * Get energy data for all meters of an object
   * Auth: Requires authentication
   * Query params: timeRange (optional)
   * Body: meterData (required)
   * Returns: Object with energy data per meter
   */
  getEnergyDataForAllMetersHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;
    const { timeRange } = req.query;
    const { meterData } = req.body;

    if (!meterData) {
      throw createValidationError("Meter-Daten sind erforderlich");
    }

    const data = await energyService.getEnergyDataForAllMeters(
      parseInt(objectId),
      meterData,
      timeRange as string | undefined
    );
    res.json(data);
  }),

  /**
   * API: GET /api/energy/specific-meter/:meterId/:objectId
   * Get energy data for a specific meter
   * Auth: Requires authentication
   * Query params: fromDate, toDate (optional)
   * Returns: Array of energy data for the meter
   */
  getEnergyDataForSpecificMeterHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { meterId, objectId } = req.params;
    const { fromDate, toDate } = req.query;

    // Parse dates if provided
    const from = fromDate ? new Date(fromDate as string) : null;
    const to = toDate ? new Date(toDate as string) : null;

    const data = await energyService.getEnergyDataForSpecificMeter(
      parseInt(meterId),
      parseInt(objectId),
      from,
      to
    );
    res.json(data);
  }),

  /**
   * API: GET /api/energy/object/:objectId
   * Get energy data for an object with flexible filtering
   * Auth: Requires authentication
   * Query params: startDate, endDate, timeRange (all optional)
   * Returns: Array of energy records
   */
  getEnergyDataForObjectHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;
    const { startDate, endDate, timeRange } = req.query;

    const data = await energyService.getEnergyDataForObject(
      parseInt(objectId),
      startDate as string | undefined,
      endDate as string | undefined,
      timeRange as string | undefined
    );
    res.json(data);
  }),

  /**
   * API: GET /api/energy/daily-consumption-data/:objectId
   * Get daily consumption data grouped by meter
   * Auth: Requires authentication
   * Query params: timeRange (required)
   * Returns: Object with daily consumption per meter
   */
  getDailyConsumptionDataHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { objectId } = req.params;
    const { timeRange } = req.query;

    if (!timeRange) {
      throw createValidationError("Zeitbereich (timeRange) ist erforderlich");
    }

    const data = await energyService.getDailyConsumptionData(
      parseInt(objectId),
      timeRange as string
    );
    res.json(data);
  }),
};
