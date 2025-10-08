import type { Request, Response } from "express";
import { usersService } from "./users.service";
import { asyncHandler, createAuthError, createValidationError, createNotFoundError } from "../../middleware/error";
import type { CreateUserData, UpdateUserData } from "./users.types";
import bcrypt from "bcrypt";

/**
 * Users Controller
 *
 * HTTP request/response handling for user management endpoints.
 * Handles users, user profiles, and mandants with proper authorization.
 */

export const usersController = {
  // ============================================================================
  // USER CRUD OPERATIONS
  // ============================================================================

  /**
   * API: GET /api/user/
   * Get all users based on user role and mandant access
   * Auth: Requires admin or superadmin role
   * Returns: Array of users filtered by mandant permissions
   */
  getUsers: asyncHandler(async (req: Request, res: Response) => {
    const sessionUser = (req as any).session?.user;

    if (!sessionUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins and superadmins can list users
    if (sessionUser.role !== 'admin' && sessionUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung für diese Aktion");
    }

    // Refresh user data to get latest mandantAccess
    const user = await usersService.getUserById(sessionUser.id);
    const currentUser = user || sessionUser;

    let users;
    if (currentUser.role === 'superadmin') {
      // Superadmin can see all users
      users = await usersService.getAllUsers();
    } else {
      // Admin can see users from their mandant and additional mandants in mandantAccess
      const accessibleMandants = [currentUser.mandantId];

      if (currentUser.mandantAccess && Array.isArray(currentUser.mandantAccess) && currentUser.mandantAccess.length > 0) {
        accessibleMandants.push(...currentUser.mandantAccess);
      }

      // Remove duplicates and filter out null/undefined values
      const uniqueMandants = Array.from(new Set(accessibleMandants)).filter(id => id != null);

      // Use multi-mandant query if multiple mandants
      if (uniqueMandants.length > 1) {
        users = await usersService.getUsersByMandants(uniqueMandants);
      } else if (uniqueMandants.length === 1) {
        users = await usersService.getUsersByMandant(uniqueMandants[0]);
      } else {
        users = [];
      }
    }

    res.json(users);
  }),

  /**
   * API: GET /api/user/:id
   * Get single user by ID
   * Auth: Users can view their own profile, admins can view any user
   * Returns: User object with profile data
   */
  getUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Users can only view their own profile unless they're admin
    if (requestingUser.id !== id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung für diese Aktion");
    }

    const user = await usersService.getUserById(id);
    if (!user) {
      throw createNotFoundError("Benutzer nicht gefunden");
    }

    res.json(user);
  }),

  /**
   * API: POST /api/user/
   * Create new user
   * Auth: Requires admin or superadmin role
   * Returns: Created user object
   */
  createUser: asyncHandler(async (req: Request, res: Response) => {
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create users
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Benutzern");
    }

    const userData = req.body as CreateUserData;

    // Validate required fields
    if (!userData.username || !userData.email) {
      throw createValidationError("Benutzername und E-Mail sind erforderlich");
    }

    // Set mandant for non-superadmin users
    if (requestingUser.role === 'admin' && !userData.mandantId) {
      userData.mandantId = requestingUser.mandantId;
    }

    const newUser = await usersService.createUser(userData);
    res.status(201).json(newUser);
  }),

  /**
   * API: PATCH /api/user/:id
   * Update user profile
   * Auth: Users can update their own profile, admins can update any user
   * Returns: Updated user object
   */
  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).session?.user;
    const updateData = req.body as UpdateUserData;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Users can only update their own profile unless they're admin
    if (requestingUser.id !== id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung für diese Aktion");
    }

    // Remove sensitive fields that users shouldn't be able to update directly
    const { password, role, mandantId, ...allowedUpdates } = updateData;

    // Only admins can update role and mandant
    if ((role || mandantId) && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Ändern von Rolle oder Mandant");
    }

    const finalUpdateData = (requestingUser.role === 'admin' || requestingUser.role === 'superadmin')
      ? updateData
      : allowedUpdates;

    const updatedUser = await usersService.updateUser(id, finalUpdateData);
    res.json(updatedUser);
  }),

  /**
   * API: POST /api/user/:id/change-password
   * Change user password
   * Auth: Users can change their own password, admins can change any password
   * Returns: Success message
   */
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Users can only change their own password unless they're admin
    if (requestingUser.id !== id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung für diese Aktion");
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw createValidationError("Neues Passwort muss mindestens 6 Zeichen lang sein");
    }

    // Get current user data (with password)
    const user = await usersService.getUserById(id);
    if (!user) {
      throw createNotFoundError("Benutzer nicht gefunden");
    }

    // For non-admin users, verify current password
    if (requestingUser.id === id && requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      if (!currentPassword) {
        throw createValidationError("Aktuelles Passwort erforderlich");
      }

      // We need to get the user with password from repository directly
      // This is a special case where we need the password hash
      const { usersRepository } = await import('./users.repository');
      const userWithPassword = await usersRepository.getUserById(id);

      if (userWithPassword?.password) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password);
        if (!isCurrentPasswordValid) {
          throw createValidationError("Aktuelles Passwort ist falsch");
        }
      }
    }

    // Update password
    await usersService.updateUserPassword(id, newPassword);

    res.json({ message: "Passwort erfolgreich geändert" });
  }),

  /**
   * API: DELETE /api/user/:id
   * Delete user
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteUser: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete users
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Benutzern");
    }

    // Prevent users from deleting themselves
    if (requestingUser.id === id) {
      throw createValidationError("Sie können sich nicht selbst löschen");
    }

    const user = await usersService.getUserById(id);
    if (!user) {
      throw createNotFoundError("Benutzer nicht gefunden");
    }

    // Admins can only delete users from their mandant (except superadmin)
    if (requestingUser.role === 'admin' && user.mandantId !== requestingUser.mandantId) {
      throw createAuthError("Keine Berechtigung zum Löschen dieses Benutzers");
    }

    await usersService.deleteUser(id);
    res.json({ message: "Benutzer erfolgreich gelöscht" });
  }),

  // ============================================================================
  // USER PROFILES MANAGEMENT
  // ============================================================================

  /**
   * API: GET /api/user/profiles/list
   * Get all user profiles
   * Auth: Requires admin or superadmin role
   * Returns: Array of user profiles
   */
  getUserProfiles: asyncHandler(async (req: Request, res: Response) => {
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can view user profiles
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung für diese Aktion");
    }

    const profiles = await usersService.getAllUserProfiles();
    res.json(profiles);
  }),

  /**
   * API: POST /api/user/profiles
   * Create user profile
   * Auth: Requires admin or superadmin role
   * Returns: Created user profile
   */
  createUserProfile: asyncHandler(async (req: Request, res: Response) => {
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create user profiles
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Benutzerprofilen");
    }

    const profileData = req.body;

    if (!profileData.name) {
      throw createValidationError("Profilname ist erforderlich");
    }

    const newProfile = await usersService.createUserProfile(profileData);
    res.status(201).json(newProfile);
  }),

  /**
   * API: PUT /api/user/profiles/:id
   * Update user profile
   * Auth: Requires admin or superadmin role
   * Returns: Updated user profile
   */
  updateUserProfile: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).session?.user;
    const updateData = req.body;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update user profiles
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Bearbeiten von Benutzerprofilen");
    }

    const updatedProfile = await usersService.updateUserProfile(parseInt(id), updateData);
    res.json(updatedProfile);
  }),

  /**
   * API: DELETE /api/user/profiles/:id
   * Delete user profile
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteUserProfile: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete user profiles
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Benutzerprofilen");
    }

    await usersService.deleteUserProfile(parseInt(id));
    res.json({ message: "Benutzerprofil erfolgreich gelöscht" });
  }),

  // ============================================================================
  // MANDANTS MANAGEMENT
  // ============================================================================

  /**
   * API: GET /api/db/mandants
   * Get all mandants
   * Auth: Requires authentication
   * Returns: Array of mandants
   */
  getMandants: asyncHandler(async (req: Request, res: Response) => {
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    const mandants = await usersService.getAllMandants();
    res.json(mandants);
  }),

  /**
   * API: POST /api/db/mandants
   * Create mandant
   * Auth: Requires admin or superadmin role
   * Returns: Created mandant
   */
  createMandant: asyncHandler(async (req: Request, res: Response) => {
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can create mandants
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Erstellen von Mandanten");
    }

    const mandantData = req.body;

    if (!mandantData.name) {
      throw createValidationError("Mandantenname ist erforderlich");
    }

    const newMandant = await usersService.createMandant(mandantData);
    res.status(201).json(newMandant);
  }),

  /**
   * API: PUT /api/db/mandants/:id
   * Update mandant
   * Auth: Requires admin or superadmin role
   * Returns: Updated mandant
   */
  updateMandant: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).session?.user;
    const updateData = req.body;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can update mandants
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Bearbeiten von Mandanten");
    }

    const updatedMandant = await usersService.updateMandant(parseInt(id), updateData);
    res.json(updatedMandant);
  }),

  /**
   * API: DELETE /api/db/mandants/:id
   * Delete mandant
   * Auth: Requires admin or superadmin role
   * Returns: Success message
   */
  deleteMandant: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).session?.user;

    if (!requestingUser) {
      throw createAuthError("Benutzer nicht authentifiziert");
    }

    // Only admins can delete mandants
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin') {
      throw createAuthError("Keine Berechtigung zum Löschen von Mandanten");
    }

    await usersService.deleteMandant(parseInt(id));
    res.json({ message: "Mandant erfolgreich gelöscht" });
  }),
};
