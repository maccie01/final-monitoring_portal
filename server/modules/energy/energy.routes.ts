import { Router } from "express";
import { energyController } from "./energy.controller";

/**
 * Energy Routes
 *
 * Express router for energy management endpoints.
 * Defines routes for day compensation data, consumption metrics, and external energy data.
 */

const router = Router();

// ============================================================================
// DAY COMP DATA ROUTES
// ============================================================================

/**
 * GET /api/energy/day-comp/:objectId
 * Get day compensation data for an object
 * Query params: startDate, endDate (optional)
 */
router.get("/day-comp/:objectId", energyController.getDayCompDataHandler);

/**
 * POST /api/energy/day-comp
 * Create new day compensation data entry
 */
router.post("/day-comp", energyController.createDayCompDataHandler);

/**
 * GET /api/energy/day-comp/:objectId/latest
 * Get latest day compensation data for an object
 */
router.get("/day-comp/:objectId/latest", energyController.getLatestDayCompDataHandler);

// ============================================================================
// DAILY CONSUMPTION ROUTES
// ============================================================================

/**
 * GET /api/energy/daily-consumption/:objectId
 * Get daily consumption statistics for an object
 * Query params: startDate, endDate (optional)
 */
router.get("/daily-consumption/:objectId", energyController.getDailyConsumptionHandler);

/**
 * GET /api/energy/daily-consumption-data/:objectId
 * Get daily consumption data grouped by meter
 * Query params: timeRange (required)
 */
router.get("/daily-consumption-data/:objectId", energyController.getDailyConsumptionDataHandler);

// ============================================================================
// EXTERNAL ENERGY DATA ROUTES
// ============================================================================

/**
 * GET /api/energy/external/:objectId
 * Get external energy data from view_mon_comp
 * Query params: limit (optional, default 12)
 */
router.get("/external/:objectId", energyController.getEnergyDataExternalHandler);

/**
 * GET /api/energy/all-meters/:objectId
 * Get energy data for all meters of an object
 * Query params: timeRange (optional)
 * Body: meterData (required)
 */
router.get("/all-meters/:objectId", energyController.getEnergyDataForAllMetersHandler);

/**
 * GET /api/energy/specific-meter/:meterId/:objectId
 * Get energy data for a specific meter
 * Query params: fromDate, toDate (optional)
 */
router.get("/specific-meter/:meterId/:objectId", energyController.getEnergyDataForSpecificMeterHandler);

/**
 * GET /api/energy/object/:objectId
 * Get energy data for an object with flexible filtering
 * Query params: startDate, endDate, timeRange (all optional)
 */
router.get("/object/:objectId", energyController.getEnergyDataForObjectHandler);

export default router;
