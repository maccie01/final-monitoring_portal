import { Router } from "express";
import { settingsController } from "./settings.controller";

/**
 * Settings Routes
 *
 * Express router for settings management endpoints.
 * Defines routes for application settings, user preferences, and system configurations.
 */

const router = Router();

// ============================================================================
// SETTINGS ROUTES
// ============================================================================

/**
 * GET /api/settings
 * Get settings with optional filters
 * Query params: category, userId, mandantId (all optional)
 */
router.get("/", settingsController.getSettingsHandler);

/**
 * GET /api/settings/by-key
 * Get single setting by category and key name
 * Query params: category (required), keyName (required), userId (optional), mandantId (optional)
 */
router.get("/by-key", settingsController.getSettingHandler);

/**
 * DELETE /api/settings/clear
 * Clear all settings (superadmin only)
 * NOTE: This route must be defined BEFORE /:id routes to avoid "clear" being treated as an ID
 */
router.delete("/clear", settingsController.clearSettingsHandler);

/**
 * GET /api/settings/:id
 * Get single setting by ID
 */
router.get("/:id", settingsController.getSettingByIdHandler);

/**
 * POST /api/settings
 * Create new setting
 */
router.post("/", settingsController.createSettingHandler);

/**
 * PUT /api/settings/:id
 * Update existing setting
 */
router.put("/:id", settingsController.updateSettingHandler);

/**
 * DELETE /api/settings/:id
 * Delete setting
 */
router.delete("/:id", settingsController.deleteSettingHandler);

export default router;
