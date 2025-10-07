import { Router } from "express";
import { databaseController } from "../controllers/databaseController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// =============================================================================
// Portal Configuration API Routes (Portal-Konfiguration)
// =============================================================================

// All portal routes require authentication
router.use(requireAuth);

// Portal configuration with settingdb_app
router.get('/config', databaseController.getPortalConfig);

// Fallback database configuration
router.get('/fallback-config', databaseController.getFallbackConfig);
router.post('/save-fallback-config', databaseController.saveFallbackConfig);
router.post('/test-connection', databaseController.testConnection);

// Portal configuration management
router.get('/load-config/:configType', databaseController.loadConfig);
router.post('/test-config/:configType', databaseController.testConfig);
router.post('/save-config/:configType', databaseController.saveConfig);
router.post('/activate-config', databaseController.activateConfig);

// Active configuration
router.get('/active-config', databaseController.getActiveConfig);

export default router;