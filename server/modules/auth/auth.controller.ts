import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { asyncHandler, createAuthError, createValidationError } from "../../middleware/error";
import type { LoginCredentials, SessionUser } from "./auth.types";

/**
 * Auth Controller
 *
 * HTTP request/response handling for authentication endpoints.
 * Thin layer that delegates business logic to authService.
 */

export const authController = {
  /**
   * API: POST /api/auth/superadmin-login
   * Parameter: Body {username, password} for Superadmin authentication
   * Purpose: System superadmin login with setup-app.json or ENV variables
   * Auth: No session required - creates new superadmin session
   * Returns: {message, user} with superadmin user information
   */
  superadminLogin: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as LoginCredentials;

    if (!username || !password) {
      throw createValidationError("Benutzername und Passwort erforderlich");
    }

    console.log(`🔍 SUPERADMIN LOGIN ATTEMPT: ${username}`);

    const isValid = authService.validateSuperadminCredentials(username, password);

    if (!isValid) {
      throw createAuthError("Ungültige Superadmin-Anmeldedaten");
    }

    // Create superadmin session
    const sessionData = authService.createSuperadminSession();
    (req.session as any).user = sessionData;

    console.log(`💯 Superadmin ${username} erfolgreich angemeldet um ${new Date().toLocaleString()}`);

    const userResponse = authService.prepareLoginResponse(sessionData, true);

    res.json({
      message: "Superadmin erfolgreich angemeldet",
      user: userResponse,
    });
  }),

  /**
   * API: POST /api/auth/login
   * Parameter: Body {username, password} for standard user authentication
   * Purpose: Normal user login with bcrypt-based authentication
   * Auth: No session required - creates new user session
   * Returns: {message, user} with user information and mandant assignment
   */
  userLogin: asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as LoginCredentials;

    if (!username || !password) {
      throw createValidationError("Benutzername und Passwort erforderlich");
    }

    console.log(`User login attempt for username: ${username}`);

    // Validate credentials (checks both superadmin and regular users)
    const validationResult = await authService.validateCredentials({ username, password });

    if (!validationResult.isValid) {
      throw createAuthError("Ungültige Anmeldedaten");
    }

    // Handle superadmin login via user endpoint
    if (validationResult.isSuperadmin) {
      const sessionData = authService.createSuperadminSession();
      (req.session as any).user = sessionData;

      const userResponse = authService.getSuperadminProfile();

      return res.json({
        message: "Superadmin erfolgreich angemeldet",
        user: userResponse,
      });
    }

    // Handle regular user login
    if (!validationResult.user) {
      throw createAuthError("Ungültige Anmeldedaten");
    }

    const user = validationResult.user;

    // Create user session
    const sessionData = authService.createUserSession(user);
    (req.session as any).user = sessionData;

    console.log(`🔐 Benutzer ${username} erfolgreich angemeldet um ${new Date().toLocaleString()}`);

    const userResponse = authService.prepareLoginResponse(user, false);

    res.json({
      message: "Erfolgreich angemeldet",
      user: userResponse,
    });
  }),

  /**
   * API: GET /api/auth/me
   * Purpose: Get current authenticated user information
   * Auth: Requires valid session
   * Returns: Complete user data with profile
   */
  getCurrentUser: asyncHandler(async (req: Request, res: Response) => {
    const session = (req as any).session;

    if (!session?.user) {
      throw createAuthError("No valid session found");
    }

    const sessionUser = session.user as SessionUser;

    // Get complete user data with profile
    const userData = await authService.getCurrentUserData(sessionUser);

    res.json(userData);
  }),

  /**
   * API: POST /api/auth/logout
   * Purpose: Destroy user session and log out
   * Auth: Requires valid session
   * Returns: Success message
   */
  logout: asyncHandler(async (req: Request, res: Response) => {
    const session = (req as any).session;

    if (session) {
      session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
          throw new Error("Logout failed");
        }
        console.log('👋 User session destroyed successfully');
      });
    }

    res.json({ message: "Logged out successfully" });
  }),

  /**
   * API: POST /api/auth/heartbeat
   * Purpose: Extend session by updating last activity
   * Auth: Requires valid session
   * Returns: Success message with timestamp
   */
  heartbeat: asyncHandler(async (req: Request, res: Response) => {
    const session = (req as any).session;

    if (!session?.user) {
      throw createAuthError("No active session");
    }

    // Update last activity timestamp
    if (session.user) {
      session.user.lastActivity = Date.now();
    }

    // Session is automatically extended by accessing it
    res.json({
      message: "Session extended",
      timestamp: new Date().toISOString(),
    });
  }),
};
