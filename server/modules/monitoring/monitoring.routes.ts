import { Router } from "express";
import { monitoringController } from "./monitoring.controller";

/**
 * Monitoring Routes
 *
 * Express router for monitoring endpoints.
 * Defines routes for dashboard KPIs, critical systems, energy classifications, and system alerts.
 */

const router = Router();

// ============================================================================
// DASHBOARD KPIs ROUTES
// ============================================================================

/**
 * GET /api/monitoring/dashboard/kpis
 * Get dashboard KPIs
 */
router.get("/dashboard/kpis", monitoringController.getDashboardKPIsHandler);

// ============================================================================
// CRITICAL SYSTEMS ROUTES
// ============================================================================

/**
 * GET /api/monitoring/systems/critical
 * Get critical systems
 * Query params: mandantIds (optional, comma-separated)
 */
router.get("/systems/critical", monitoringController.getCriticalSystemsHandler);

// ============================================================================
// ENERGY CLASS ROUTES
// ============================================================================

/**
 * GET /api/monitoring/systems/by-energy-class
 * Get systems by energy class
 * Query params: mandantIds (optional, comma-separated)
 */
router.get("/systems/by-energy-class", monitoringController.getSystemsByEnergyClassHandler);

// ============================================================================
// SYSTEM ALERTS ROUTES
// ============================================================================

/**
 * GET /api/monitoring/alerts
 * Get system alerts
 * Query params: systemId (optional), unresolved (optional), mandantIds (optional, comma-separated)
 */
router.get("/alerts", monitoringController.getSystemAlertsHandler);

/**
 * POST /api/monitoring/alerts
 * Create new system alert
 * Body: Alert data (message, alertType, severity, objectId, metadata)
 */
router.post("/alerts", monitoringController.createSystemAlertHandler);

/**
 * PATCH /api/monitoring/alerts/:id/resolve
 * Resolve system alert
 */
router.patch("/alerts/:id/resolve", monitoringController.resolveAlertHandler);

export default router;
