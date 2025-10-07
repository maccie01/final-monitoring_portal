import { Router } from "express";
import { authController } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Public auth routes (no authentication required)
router.post('/superadmin-login', authController.superadminLogin);
router.post('/user-login', authController.userLogin);
router.post('/logout', authController.logout);

// Protected auth routes (authentication required)
router.get('/user', requireAuth, authController.getCurrentUser);

export default router;