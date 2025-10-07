import { Router } from "express";
import { userController } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// =============================================================================
// User Management API Routes (Benutzerverwaltung)
// =============================================================================

// All user routes require authentication
router.use(requireAuth);

// User profiles management (MUST be before /:id routes)
router.get('/profiles/list', userController.getUserProfiles);
router.post('/profiles', userController.createUserProfile);
router.put('/profiles/:id', userController.updateUserProfile);
router.delete('/profiles/:id', userController.deleteUserProfile);

// Password management (specific routes before generic /:id)
router.post('/:id/change-password', userController.changePassword);

// User CRUD operations (generic /:id route LAST)
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.patch('/:id', userController.updateUser);  // PATCH statt PUT für partial updates
router.delete('/:id', userController.deleteUser);
router.get('/:id', userController.getUser);

export default router;