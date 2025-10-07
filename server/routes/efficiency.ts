import { Router } from "express";
import { efficiencyController } from "../controllers/efficiencyController";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// =============================================================================
// Efficiency Analysis API Routes (Effizienz-Analyse)
// =============================================================================

// All efficiency routes require authentication (supports demo sessions)
router.use(isAuthenticated);

// Efficiency analysis endpoints (nur echte DB-Daten, keine Mock-Daten)
router.get('/efficiency-analysis/:objectId', efficiencyController.getEfficiencyAnalysis);

export default router;