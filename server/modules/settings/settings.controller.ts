import type { Request, Response } from "express";
import { settingsService } from "./settings.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";
import type { InsertSettings } from "@shared/schema";

/**
 * Settings Controller
 *
 * HTTP request/response handling for settings management endpoints.
 * Handles application settings, user preferences, and system configurations.
 */

export const settingsController = {
  // ============================================================================
  // SETTINGS ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/settings
   * Get settings with optional filters
   * Auth: Requires authentication
   * Query params: category, userId, mandantId (all optional)
   * Returns: Array of Settings records
   */
  getSettingsHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { category, userId, mandantId } = req.query;

    const filters: any = {};
    if (category) filters.category = category as string;
    if (userId) filters.user_id = userId as string;
    if (mandantId) filters.mandant_id = parseInt(mandantId as string);

    const data = await settingsService.getSettings(filters);
    res.json(data);
  }),

  /**
   * API: GET /api/settings/by-key
   * Get single setting by category and key name
   * Auth: Requires authentication
   * Query params: category (required), keyName (required), userId (optional), mandantId (optional)
   * Returns: Single Settings record
   */
  getSettingHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { category, keyName, userId, mandantId } = req.query;

    if (!category || !keyName) {
      throw createValidationError("Category und keyName sind erforderlich");
    }

    const data = await settingsService.getSetting(
      category as string,
      keyName as string,
      userId as string | undefined,
      mandantId ? parseInt(mandantId as string) : undefined
    );

    if (!data) {
      throw createNotFoundError("Setting nicht gefunden");
    }

    res.json(data);
  }),

  /**
   * API: GET /api/settings/:id
   * Get single setting by ID
   * Auth: Requires authentication
   * Returns: Single Settings record
   */
  getSettingByIdHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    const data = await settingsService.getSettingById(parseInt(id));

    if (!data) {
      throw createNotFoundError("Setting nicht gefunden");
    }

    res.json(data);
  }),

  /**
   * API: POST /api/settings
   * Create new setting
   * Auth: Requires admin or superadmin role
   * Returns: Created Settings record
   */
  createSettingHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create settings
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Settings");
    }

    const settingData = req.body as InsertSettings;

    // Validate required fields
    if (!settingData.category) {
      throw createValidationError("Category ist erforderlich");
    }

    if (!settingData.key_name) {
      throw createValidationError("Key name ist erforderlich");
    }

    if (settingData.value === undefined || settingData.value === null) {
      throw createValidationError("Value ist erforderlich");
    }

    const newData = await settingsService.createSetting(settingData);
    res.status(201).json(newData);
  }),

  /**
   * API: PUT /api/settings/:id
   * Update existing setting
   * Auth: Requires admin or superadmin role
   * Returns: Updated Settings record
   */
  updateSettingHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update settings
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Aktualisieren von Settings");
    }

    const { id } = req.params;
    const settingData = req.body as Partial<InsertSettings>;

    const updatedData = await settingsService.updateSetting(parseInt(id), settingData);
    res.json(updatedData);
  }),

  /**
   * API: DELETE /api/settings/:id
   * Delete setting
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteSettingHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete settings
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Settings");
    }

    const { id } = req.params;

    await settingsService.deleteSetting(parseInt(id));
    res.json({ message: "Setting erfolgreich gelöscht" });
  }),

  /**
   * API: DELETE /api/settings/clear
   * Clear all settings (admin only)
   * Auth: Requires superadmin role
   * Returns: Array of deleted Settings records
   */
  clearSettingsHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only superadmin can clear all settings
    if (sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen aller Settings (nur Superadmin)");
    }

    const deletedSettings = await settingsService.clearSettings();
    res.json({
      message: "Alle Settings erfolgreich gelöscht",
      count: deletedSettings.length,
      deletedSettings
    });
  }),
};
