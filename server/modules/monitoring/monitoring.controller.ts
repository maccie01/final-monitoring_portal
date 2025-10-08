import type { Request, Response } from "express";
import { monitoringService } from "./monitoring.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";

/**
 * Monitoring Controller
 *
 * HTTP request/response handling for monitoring endpoints.
 * Handles dashboard KPIs, critical systems, energy classifications, and system alerts.
 */

export const monitoringController = {
  // ============================================================================
  // DASHBOARD KPIs ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/monitoring/dashboard/kpis
   * Get dashboard KPIs
   * Auth: Requires authentication
   * Returns: Dashboard KPIs object
   */
  getDashboardKPIsHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const data = await monitoringService.getDashboardKPIs();
    res.json(data);
  }),

  // ============================================================================
  // CRITICAL SYSTEMS ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/monitoring/systems/critical
   * Get critical systems
   * Auth: Requires authentication
   * Query params: mandantIds (optional, comma-separated)
   * Returns: Array of critical systems
   */
  getCriticalSystemsHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Determine admin status
    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'superadmin';

    // Parse mandant IDs from query or session
    let mandantIds: number[] | undefined;
    if (req.query.mandantIds) {
      const mandantIdsParam = req.query.mandantIds as string;
      mandantIds = mandantIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    } else if (!isAdmin && sessionUser.mandantIds) {
      mandantIds = sessionUser.mandantIds;
    }

    const data = await monitoringService.getCriticalSystems(mandantIds, isAdmin);
    res.json(data);
  }),

  // ============================================================================
  // ENERGY CLASS ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/monitoring/systems/by-energy-class
   * Get systems by energy class
   * Auth: Requires authentication
   * Query params: mandantIds (optional, comma-separated)
   * Returns: Array of systems classified by energy consumption
   */
  getSystemsByEnergyClassHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Determine admin status
    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'superadmin';

    // Parse mandant IDs from query or session
    let mandantIds: number[] | undefined;
    if (req.query.mandantIds) {
      const mandantIdsParam = req.query.mandantIds as string;
      mandantIds = mandantIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    } else if (!isAdmin && sessionUser.mandantIds) {
      mandantIds = sessionUser.mandantIds;
    }

    const data = await monitoringService.getSystemsByEnergyClass(mandantIds, isAdmin);
    res.json(data);
  }),

  // ============================================================================
  // SYSTEM ALERTS ENDPOINTS
  // ============================================================================

  /**
   * API: GET /api/monitoring/alerts
   * Get system alerts
   * Auth: Requires authentication
   * Query params: systemId (optional), unresolved (optional), mandantIds (optional, comma-separated)
   * Returns: Array of system alerts
   */
  getSystemAlertsHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Determine admin status
    const isAdmin = sessionUser.role === 'admin' || sessionUser.role === 'superadmin';

    // Parse query parameters
    const systemId = req.query.systemId ? parseInt(req.query.systemId as string) : undefined;
    const unresolved = req.query.unresolved === 'true' ? true : req.query.unresolved === 'false' ? false : undefined;

    // Parse mandant IDs from query or session
    let mandantIds: number[] | undefined;
    if (req.query.mandantIds) {
      const mandantIdsParam = req.query.mandantIds as string;
      mandantIds = mandantIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    } else if (!isAdmin && sessionUser.mandantIds) {
      mandantIds = sessionUser.mandantIds;
    }

    const data = await monitoringService.getSystemAlerts({
      systemId,
      unresolved,
      mandantIds,
      isAdmin
    });

    res.json(data);
  }),

  /**
   * API: POST /api/monitoring/alerts
   * Create new system alert
   * Auth: Requires authentication
   * Body: Alert data (message, alertType, severity, objectId, metadata)
   * Returns: Created system alert
   */
  createSystemAlertHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const alertData = req.body;

    // Validate required fields
    if (!alertData.message) {
      throw createValidationError("Alert message ist erforderlich");
    }

    const newAlert = await monitoringService.createSystemAlert(alertData);
    res.status(201).json(newAlert);
  }),

  /**
   * API: PATCH /api/monitoring/alerts/:id/resolve
   * Resolve system alert
   * Auth: Requires authentication
   * Returns: Resolved system alert
   */
  resolveAlertHandler: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const { id } = req.params;

    if (!id) {
      throw createValidationError("Alert ID ist erforderlich");
    }

    const resolvedAlert = await monitoringService.resolveAlert(parseInt(id), sessionUser.id);

    if (!resolvedAlert) {
      throw createNotFoundError("Alert nicht gefunden");
    }

    res.json(resolvedAlert);
  }),
};
