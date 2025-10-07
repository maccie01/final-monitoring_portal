import { Router } from "express";
import { temperatureController } from "../controllers/temperatureController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Alle Temperatur-Routen erfordern Authentifizierung
router.use(requireAuth);

// GET /api/settings/thresholds - Schwellwerte für Temperaturanalyse abrufen
router.get('/settings/thresholds', temperatureController.getThresholds);

// GET /api/temperature-analysis/:objectId - Temperaturanalyse für einzelnes Objekt
router.get('/temperature-analysis/:objectId', temperatureController.analyzeObjectTemperature);

// GET /api/temperature-analysis - Temperaturanalyse für alle Objekte
router.get('/temperature-analysis', temperatureController.analyzeAllObjectsTemperature);

export { router as temperatureRoutes };