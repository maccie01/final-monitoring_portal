import { Router } from "express";
import { databaseController } from "../controllers/databaseController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All database routes require authentication
router.use(requireAuth);

// Database status and health checks
router.get('/status', databaseController.getStatus);

// Object management
router.get('/objects', databaseController.getObjects);

// Mandant management  
router.get('/mandants', databaseController.getMandants);

// Settings management
router.get('/settings', databaseController.getSettings);
router.post('/settings', databaseController.saveSetting);

// Dashboard data
router.get('/dashboard/kpis', databaseController.getDashboardKpis);

export default router;