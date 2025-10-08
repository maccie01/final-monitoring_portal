import { Router } from "express";
import { temperatureController } from "./temperature.controller";

/**
 * Temperature Routes
 *
 * Express router for temperature management endpoints.
 * Defines routes for daily outdoor temperatures, postal code queries, and efficiency data.
 */

const router = Router();

// ============================================================================
// DAILY OUTDOOR TEMPERATURE ROUTES
// ============================================================================

/**
 * GET /api/temperature/daily-outdoor
 * Get daily outdoor temperatures with optional filters
 * Query params: postalCode, startDate, endDate, resolution (all optional)
 */
router.get("/daily-outdoor", temperatureController.getDailyOutdoorTemperaturesHandler);

/**
 * GET /api/temperature/daily-outdoor/:id
 * Get single daily outdoor temperature by ID
 */
router.get("/daily-outdoor/:id", temperatureController.getDailyOutdoorTemperatureHandler);

/**
 * POST /api/temperature/daily-outdoor
 * Create new daily outdoor temperature record
 */
router.post("/daily-outdoor", temperatureController.createDailyOutdoorTemperatureHandler);

/**
 * PUT /api/temperature/daily-outdoor/:id
 * Update existing daily outdoor temperature record
 */
router.put("/daily-outdoor/:id", temperatureController.updateDailyOutdoorTemperatureHandler);

/**
 * DELETE /api/temperature/daily-outdoor/:id
 * Delete daily outdoor temperature record
 */
router.delete("/daily-outdoor/:id", temperatureController.deleteDailyOutdoorTemperatureHandler);

// ============================================================================
// POSTAL CODE QUERY ROUTES
// ============================================================================

/**
 * GET /api/temperature/postal-code/:postalCode
 * Get temperatures by postal code with optional date range
 * Query params: startDate, endDate (optional)
 */
router.get("/postal-code/:postalCode", temperatureController.getTemperaturesByPostalCodeHandler);

/**
 * GET /api/temperature/postal-code/:postalCode/latest
 * Get latest temperature for a specific postal code
 */
router.get("/postal-code/:postalCode/latest", temperatureController.getLatestTemperatureForPostalCodeHandler);

/**
 * GET /api/temperature/objects/postal-codes
 * Get temperatures for postal codes of specified objects
 * Query params: objectIds (optional comma-separated)
 */
router.get("/objects/postal-codes", temperatureController.getTemperaturesForObjectPostalCodesHandler);

// ============================================================================
// EFFICIENCY DATA ROUTES
// ============================================================================

/**
 * GET /api/temperature/efficiency/:objectId
 * Get temperature efficiency data for an object
 * Query params: timeRange (optional, default 'last30days')
 */
router.get("/efficiency/:objectId", temperatureController.getTemperatureEfficiencyDataHandler);

export default router;
