import { Router } from "express";
import { authController } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rate-limit";

const router = Router();

// Public auth routes (no authentication required)
// Rate limited to prevent brute force attacks
router.post('/superadmin-login', authRateLimiter, authController.superadminLogin);
router.post('/user-login', authRateLimiter, authController.userLogin);
router.post('/logout', authController.logout);

// Protected auth routes (authentication required)
router.get('/user', requireAuth, authController.getCurrentUser);

export default router;