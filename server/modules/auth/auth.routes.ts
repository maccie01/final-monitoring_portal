import { Router } from "express";
import { authController } from "./auth.controller";

/**
 * Auth Routes
 *
 * Route definitions for authentication endpoints.
 * All routes are prefixed with /api/auth
 */

const router = Router();

/**
 * POST /api/auth/superadmin-login
 * Superadmin login with setup-app.json or environment variables
 */
router.post("/superadmin-login", authController.superadminLogin);

/**
 * POST /api/auth/login
 * Standard user login with database credentials
 */
router.post("/login", authController.userLogin);

/**
 * GET /api/auth/me
 * Get current authenticated user information
 */
router.get("/me", authController.getCurrentUser);

/**
 * POST /api/auth/logout
 * Destroy session and log out
 */
router.post("/logout", authController.logout);

/**
 * POST /api/auth/heartbeat
 * Extend session by updating activity
 */
router.post("/heartbeat", authController.heartbeat);

export const authRoutes = router;
