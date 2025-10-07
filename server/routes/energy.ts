import { Router } from "express";
import { energyController } from "../controllers/energyController";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// =============================================================================
// Energy Data API Routes (Energiedaten-Verwaltung)
// =============================================================================

// All energy routes require authentication (with demo session fallback)
router.use(isAuthenticated); // Re-enabled for proper session handling

// Energy data CRUD operations
router.get('/energy-data', energyController.getEnergyData);
router.post('/energy-data', energyController.createEnergyData);

// Daily and monthly consumption data for KI-Energy components
router.get('/daily-consumption/:objectId', energyController.getDailyConsumption);
router.get('/monthly-consumption/:objectId', energyController.getMonthlyConsumption);
router.get('/energy-data-meters/:objectId', energyController.getMeterEnergyData);

// Analysis endpoints
router.get('/energy-data/temperature-efficiency-chart/:objectId', energyController.getTemperatureEfficiencyChart);

export default router;