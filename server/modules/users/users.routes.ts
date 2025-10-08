import { Router } from "express";
import { usersController } from "./users.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

/**
 * Users Module Routes
 *
 * Defines all HTTP routes for user management, user profiles, and mandants.
 * All routes require authentication via requireAuth middleware.
 */

// All user routes require authentication
router.use(requireAuth);

// ============================================================================
// USER PROFILES MANAGEMENT (must be before /:id routes to avoid conflicts)
// ============================================================================

// GET /api/user/profiles/list - Get all user profiles
router.get('/profiles/list', usersController.getUserProfiles);

// POST /api/user/profiles - Create user profile
router.post('/profiles', usersController.createUserProfile);

// PUT /api/user/profiles/:id - Update user profile
router.put('/profiles/:id', usersController.updateUserProfile);

// DELETE /api/user/profiles/:id - Delete user profile
router.delete('/profiles/:id', usersController.deleteUserProfile);

// ============================================================================
// PASSWORD MANAGEMENT (specific routes before generic /:id)
// ============================================================================

// POST /api/user/:id/change-password - Change user password
router.post('/:id/change-password', usersController.changePassword);

// ============================================================================
// USER CRUD OPERATIONS (generic /:id route LAST to avoid conflicts)
// ============================================================================

// GET /api/user/ - Get all users (filtered by mandant access)
router.get('/', usersController.getUsers);

// POST /api/user/ - Create new user
router.post('/', usersController.createUser);

// PATCH /api/user/:id - Update user (partial update)
router.patch('/:id', usersController.updateUser);

// DELETE /api/user/:id - Delete user
router.delete('/:id', usersController.deleteUser);

// GET /api/user/:id - Get single user by ID
router.get('/:id', usersController.getUser);

export default router;
